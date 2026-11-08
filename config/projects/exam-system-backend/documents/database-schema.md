# Lab LMS Database Schema v4

**Changes, Additions and Definitions**

*Astrid and Christian Brinkmann — 19.07.2025*

# What do we need? \- new Tables to add to the database

- **checkpoints** table that contains all checkpoints of all challenges

  - **challenge\_id**: serial  
    - *unique* and *index* on this field  
  - **fixed\_order**: bool  
    - If true, the order of sections is fixed and cannot be changed automatically by the system.  
    - If false, the order can be changed.  
  - **duration**: int8  
    - The duration specified in the checkpoint configuration view in minutes  
  - **status**: int2  
    - Shows in what stage the checkpoint is- referring to the states Upcoming, Current, Pending Grading ... in the teacher view  
    - *index* on this field  
  - **created\_at**: timestamptz  
    - The time when the checkpoint was created. \-- **author\_id**: int4  
    - The author of the checkpoint.  
    - This could be a foreign key to a users table or similar.  
  - **version**: int4  
    - can use later if we want to support version control The pk is (**challenge\_id**, **version**)  
- **sections** table that contains all sections of all checkpoints

  - **challenge\_id**: int4  
    - The challenge (which should be a checkpoint) this section belongs to.  
    - *key* to the **challenges** table  
    - *index* on this field  
  - **checkpoint\_version**: int4  
    - The version of the checkpoint this section belongs to.  
    - *key* together with **challenge\_id** to the **checkpoints** table  
    - *index* on this field  
  - **id**: serial  
    - *unique* and *index* on this field  
  - **name**: varchar  
    - Essentially the title of the section.  
  - **section\_text**: varchar  
    - The text content of the section that is displayed to the student. Can potentially refer to files in the **section\_files** table to display images, videos, or other media.  
  - **fixed\_order**: bool  
    - If true, the order of questions is fixed and cannot be changed automatically by the system.  
    - If false, the order can be changed.  
  - **position**: int2  
    - Defines the order of sections \- if the order is fixed  
    - Lower values come first.  
- **section\_files** table that contains all files related to sections

  - **section\_id**: int4  
    - *key* to the **sections** table  
    - *index* on this field  
  - **id**: serial  
    - *unique* and *index* on this field  
  - **name**: varchar  
    - The actual human readable name of the file.  
  - **key**: varchar  
    - The key used in aws s3 to access the file.  
- **question\_files** table that contains all files related to questions

  - **question\_id**: int8  
    - *key* to the **checkpoint\_questions** table  
    - *index* on this field  
  - **id**: serial  
    - *unique* and *index* on this field  
  - **name**: varchar  
    - The actual human readable name of the file.  
  - **key**: varchar  
    - The key used in aws s3 to access the file.  
- **checkpoint\_question\_slots** table that contains all slots for questions in checkpoints, associates questions with their sections

  - **section\_id**: int4  
    - *key* to the **sections** table  
    - *index* on this field  
  - **id**: bigserial  
    - *unique* and *index* on this field  
  - **max\_mark\_numerator** *int8*  
  - **max\_mark\_denominator** *int8*  
    - The maximum number of points for the question slot expressed as a rational number.  
    - This allows for more precise grading, as we can represent marks like 1/3 without losing precision.  
  - **position**: int2  
    - Defines order of the question in its section \- if the order is fixed  
    - Lower values come first.  
    - This allows for reordering of questions in a checkpoint.  
- **checkpoint\_questions** table that contains all questions related to checkpoints (not races or sprints)

  - **id**: bigserial  
    - *unique* and *index* on this field  
    - Ordinariliy, \~4 billion questions should be more than sufficient, but automatically generating them could throw a wrench in the works if something goes wrong.  
    - Using int8 allows for 18 quintillion questions.  
  - **question\_slot\_id**: int4  
    - The slot this question belongs to.  
    - *key* to the **checkpoint\_question\_slot** table  
    - *index* on this field  
  - **content**: jsonb  
    - The content of the question.  
    - This could be a JSON object containing the question text, selectable answers if applicable, the correct/reference answer(s), Explanation, and any other relevant information.  
    - *index* on this field  
  - **answer\_type**: int4  
    - Single choice, multiple choice, open ended, cloze, maybe more in the future  
  - **author\_id**: integer  
    - user who created the question  
    - *key* to the **users** table  
    - *index* on this field  
- **question\_tags** table that allows for tagging questions

  - **id**: serial  
    - *unique* and *index* on this field  
    - The tag this question belongs to.  
  - **question\_id**: int8  
    - *index* on this field  
    - The question this tag belongs to.  
    - *key* to the **checkpoint\_questions** table  
  - **tag**: varchar  
    - *index* on this field  
    - The tag itself.  
    - This could be a string representing the tag name or identifier.  
  - **tag\_details**: jsonb  
    - Additional details about the tag.  
    - This could be a JSON object containing metadata about the tag, such as its author, creation date, or categories et cetera.  
- **question\_slot\_selections** table that specifies which questions are selected for progress

  - **question\_slot\_id**: int4  
    - *index* on this field  
    - The slot this question belongs to.  
    - *key* to the **checkpoint\_question\_slot** table  
  - **question\_id**: int8  
    - *index* on this field  
    - The question this slot belongs to.  
    - *key* to the **checkpoint\_questions** table  
  - **progress\_id**: int4  
    - *index* on this field  
    - The progress the selection belongs to.  
    - *key* to the **progresses** table  
- **prompts** table that contains prompts we use to interact with llms

  - **id**: serial  
    - *unique* and *index* on this field  
    - The prompt this question belongs to.  
  - **purpose\_id**: int2  
    - *index* on this field  
    - The use case of the prompt, like "generate answers", "generate questions", "generate explanations", "check answers", "check questions", "check explanations", "generate code", "check code", "generate tests", "check tests" et cetera.  
      - But encoded as an int2  
    - Specifies the purpose of the prompt.  
  - **author\_id**: int4  
    - The author of the prompt, a user id.  
    - *index* on this field  
    - *key* to the **users** table  
  - **content**: jsonb  
    - The content of the prompt.  
    - This could be a JSON object containing the prompt text, parameters, and any other relevant information.  
- **comments** table that contains comments

  - **id**: int8  
    - *unique* and *index* on this field  
  - **progress\_id**: int4  
    - *index* on this field  
    - the progress the comment belongs to  
    - *key* to the **progresses** table  
  - **question\_id**: int8  
    - *index* on this field  
    - *key* to the **checkpoint\_questions** table  
    - The question this comment belongs to.  
    - This allows for associating comments with specific questions in a checkpoint.  
  - **content**: varchar  
    - content of the comment  
  - **user\_id**: int4  
    - user that wrote the comment  
  - **mentor**: boolean  
    - true if the user who wrote the comment is the teacher, false otherwise  
  - **updated\_at**: timestamptz  
  - **created\_at**: timestamptz  
- **progress\_mentor\_interactions** table that specifies for a progress whether the grade given by the mentior is visible for the team belonging to the progress (in our case team with one member) and also used to save if a teacher allows the student to take more time for the test

  - **progress\_id**: int4  
    - *unique* and *index* on this field  
    - *key* to the **progresses** table  
  - **published\_status**: int4  
    - 0: teacher review not published  
    - 1: teacher review published  
    - 2: teacher review published and reviewed by student  
    - 3: review window closed  
  - **exam\_started\_at**: timestampz  
    - time when the exam was started by the student  
  - **auto\_eval\_started\_at**: timestampz  
    - time when the auto-evaluation was started by the student  
      - we can use this to get the evaluation time by subtracting this from **auto\_eval\_finished\_at**  
      - we can also know that this evaluation is currently ongoing and don't start multiple evaluations at the same time  
  - **auto\_eval\_finished\_at**: timestampz  
    - time when the auto-evaluation was finished by the student  
      - we can use this to get the evaluation time by subtracting **auto\_eval\_started\_at** from this  
      - if this is not set but **auto\_eval\_started\_at** is, we know that the evaluation is currently ongoing and don't start multiple evaluations at the same time. We can also define a timeout, so the evaluation could be restarted if it takes too long.  
  - **time\_extension**: minutes  
    - null \-\> no extension  
    - otherwise: number of minutes the student is allowed to take in addition for the checkpoint  
  - **extension\_start\_at**: timestamptz  
    - null \-\> no extension  
    - otherwise: time when the extended time was started by the student  
      - if the exam was finished and got extended afterwards, this time will be set to when the student restarts the exam, such that he or she has to be finished by **extension\_start\_at** \+ **time\_extension**  
      - if the exam is still ongoing, this time will be set to **start\_at** \+ **duration**  
  - **comments\_finished**: boolean  
    - did the teacher finish the conversation  
- **progress\_checkpoint\_versions** table that specifies the checkpoint version for a progress

  - **progress\_id**: int4  
    - *unique* and *index* on this field  
    - *key* to the **progresses** table  
  - **checkpoint\_version**: int4  
    - *index* on this field  
    - *key* together with **checkpoint\_id** from **progresses** to the **checkpoints** table  
    - The version of the checkpoint this progress belongs to.  
    - This allows for tracking which version of a checkpoint a progress is based on.

## What do we reuse?

- **challenges** table that contains all the challenges (also Races and sprints)

  - **id**: serial  
  - **name**:varchar  
  - **summary**:varchar  
    - text summarizing the challenge  
  - **type\_id**:int4  
    - SPRINT: 1, RACE: 2, CHECKPOINT: 3  
  - **branch\_id**: int4  
    - the branch the challenge belongs to  
  - **max\_mark**: int4  
    - in races and sprints: maximum 200  
  - **estimation**: int4  
    - probably estimation of how long the challenge should take (not 100% sure)  
    - default value 1  
    - can pobably ignore  
  - **upload\_type\_id**: int4 \-GIT: 1, FILES: 2 \-default 2  
  - **assessment\_number**:int4 \-default when creating the challenge is 0 \-number of assessments by other students for the challenge \-we can ignore this  
  - **team\_size**: int4  
    - if type\_id\!=CHALLENGE\_TYPE.Race: default=1  
    - we create a team containing one member for each exam for consistency with the other type of challenges  
  - **auto\_team**: boolean  
    - can ignore  
  - **allowed\_mimetypes**: jsonb  
    - the kind of files the students are allowed to upload for their solutions (Docs, Table, Archive, Images)  
    - can ignore  
  - **start\_at**:timestamptz  
  - **end\_at**:timestamptz  
  - **dependeny**: integer  
    - CHAIN: 1, TIME: 2, TIME\_CHAIN: 3  
    - CHAIN: possibly other challenges have to be completed before  
    - TIME: start and end time are specified  
    - TIME\_CHAIN: TIME \+ CHAIN  
  - **fos\_id**: integer  
    - field of studies challenge belongs to  
  - **has\_tests**: boolean  
    - specifies whether there are unit tests  
    - default: false \-\> can ignore  
- **progresses** when a student accepts a challenge, a progress is created to store information about the execution of the challenge (see in the code accept.js/environment.js), in our case of the checkpoints this stores information about an exam

  - **id**: serial  
  - **mark**: int4  
    - used for challenges with assessments to store the average mark for the assessments  
  - **challenge\_id**: int4 \-challenge the progress belongs to  
  - **graded\_at**: timestamptz  
    - time when the mark was set for the assessments in case there are assessment  
    - also used for challenges without assessments to store times for transition to a certain status  
  - **status**: int  
    - PENDING: \-1, IN\_PROGRESS: 0, REFLECTION: 1, ASSESSMENT: 2, FINISHED: 3, GIVE\_UP: \-2, RETRY: \-3,  
  - **createdAt**: timestamptz  
  - **updatedAt**: timestamptz  
  - **team\_id**: int4  
    - we create a team with only one user which is the student taking the exam, the team\_id is a reference to the key in the teams table  
  - **start\_at**:timestamptz  
    - time when the progress was created, progress is create for the student when he/she accepts the challenge  
  - **ready\_to\_check**:boolean  
    - indicates whether the challenge can be assessed by other students  
    - we can ignore this  
  - **finished\_at**:timestamptz  
    - time students submits solution (see finish.js)  
- **teams**: when a challenge is accepted a team is created for the progress, for the checkpoints we create a team with only one member who is the leader of the team (see code createProgressEnv-\>createTeam)

  - **id**: int4  
  - **locked**: boolean  
    - true \-\> the team cannot be changed anymore  
  - **leader\_id**: int4  
    - foreign key referencing users.id  
- **team\_members**:

  - **user\_id**: int4  
    - foreign key referencing users.id  
  - **team\_id**: int4  
    - foreign key referencing teams.id  
  - **pending**: boolean  
- **mentor\_marks**

  - **progress\_id**: int4  
    - progress (in our understanding exam) that is marked  
  - **mark**: int4  
    - we can use this to save the points across the exam the student got  
  - **mentor\_id**: int4  
  - **graded\_at**: timestamptz  
  - **comment**: text  
- **checkpoint\_answers**

  - **progress\_id**: int4  
    - *key* to the **progresses** table  
    - *index* on this field  
    - The progress (exam) this answer belongs to.  
    - the progress we want to refer to  
  - **question\_id**: int8  
    - *key* to the **checkpoint\_questions** table  
    - references question for which the answer is saved  
  - **answer**: jsonb  
    - used to save the answers given by the student for the exam and also later for the teacher to save how answers from the student are graded  
- **challenges\_files** table that contains all files related to challenges

  - **challenge\_id**: int4  
  - **id**: serial  
    - *unique* and *index* on this field  
  - **name**: varchar  
    - The actual human readable name of the file.  
  - **key**: varchar  
    - The key used in aws s3 to access the file.  
- **mentor\_activities**

  - **id**: int8  
    - *unique* and *index* on this field  
  - **user\_id**: int4  
    - *key* to the **users** table  
    - *index* on this field  
    - The user who performed the activity  
  - **activity**: varchar  
    - The activity performed by the user  
    - This could be a string representing the activity name or identifier.  
  - **activity\_data**: jsonb  
    - Additional data related to the activity.  
    - This could be a JSON object containing metadata about the activity, such as timestamps, parameters, or other relevant information.  
  - **affected\_challenge**: int  
    - *index* on this field  
    - The challenge affected by the activity.  
    - This could be a foreign key to a challenges table or similar.  
  - **date**: timestampz  
    - *index* on this field  
    - The date and time when the activity was performed.  
    - This could be a timestamp with timezone information to ensure accurate time representation across different time zones.

activity : varchar affected\_project : int affected\_challenge : int date : timestampz

- **challenge\_subjects** table that specifies the subjects for the challenges, we should do the same that is done for the other challenges to store the subjects (see function updateChallenge in the code)

  - **challenge\_id**: int4  
  - **subject\_id**: int4  
    - foreign key references subjects.id  
  - **percentage**: int4  
  - **topics**: text  
- **subjects** table that specifies the subjects that exist

  - **id**: int4  
  - **name**: text

# Changes and additions as a diagram

*The r10 schema diagram is not included in this export.*

On the left side are existing tables that are not changed, on the right side are new tables or existing tables that are changed.

# JSON Schemas

## checkpoint\_questions

The `answer_type` field can be one of the following values:

- `1`: Single-choice question  
- `2`: Multiple-choice question  
- `3`: Cloze question (fill-in-the-blank)  
- `4`: Open-ended question

### single-choice

```json
{
    "question_text": "What is the capital of France?",
    "options": [
        "Paris",
        "London",
        "Berlin",
        "Madrid"
    ],
    "correct_answer": 0,
    "explanation": "London is the capital of the United Kingdom, Berlin is the capital of Germany, and Madrid is the capital of Spain. Paris has been the capital of France since 508 AD when Clovis I established it as the center of his kingdom. The city was originally known as Lutetia during Roman times."
}
```

### multiple-choice

```json
{
    "question_text": "Which of the following are programming languages?",
    "options": [
        "Python",
        "HTML",
        "CSS",
        "JavaScript"
    ],
    "correct_answers": [0, 3],
    "explanation": "Python and JavaScript are programming languages, while HTML and CSS are markup and style sheet languages, respectively."
}
```

## cloze questions aka fill-in-the-blank aka "lückentext"

```json
{
    "question_text": [
        "The ____ model is a seven-layer framework that standardizes ____ communication, from ____ transmission (Layer 1) to ____ interactions (Layer 7). Each layer has a specific role, ensuring reliable and interoperable communication between ____. While modern networks often use simplified models like ____, the OSI model remains a key reference for understanding networking concepts."
    ],
    "correct_answers": ["OSI", "network", "physical data", "application-level", "devices", "TCP/IP"],
    "incorrect_answers": ["data link", "transport", "UDP"],
    "explanation": "The OSI model is a conceptual framework used to understand and standardize the functions of a telecommunication or computing system without regard to its underlying internal structure and technology. It divides the communication process into seven layers, each with specific responsibilities.

    The seven layers are:
    1. Physical Layer
    2. Data Link Layer
    3. Network Layer
    4. Transport Layer
    5. Session Layer
    6. Presentation Layer
    7. Application Layer
    
    Nowadays, the OSI model is often compared to the more commonly used TCP/IP model, which has fewer layers but serves a similar purpose in standardizing network communication."
}

```

### open-ended

```json
{
    "question_text": "Explain the concept of polymorphism in object-oriented programming.",
    "correct_answer": "Polymorphism is the ability of different classes to be treated as instances of the same class through a common interface. It allows methods to do different things based on the object it is acting upon, even if they share the same method name.",
    "explanation": "Polymorphism is a core concept in object-oriented programming that enables flexibility and reusability of code."
}
```

## checkpoint\_answers

### Single-choice:

```json
{
    "answer": 0
}
```

Results in $\frac{1}{1} = 100\%$ of the max\_marks for the question.

Note that we are using `-1` to indicate no answer being selected.

### Multiple-choice:

```json
{
    "answer": [0, 2],
}
```

Results in $\frac{1}{2} = 50\%$ of the max\_marks for the question.

Note that we are using `[-1]` to indicate no answer being selected, although this is not strictly necessary, as the answer can also be an empty array, but this is more consistent with the single-choice answers.

### Fill-in-the-blank aka “Lückentext”:

```json
{
    "answer": [
        ["TCP/IP", "", "physical data", "application-level", "devices", "OSI"],
    ]
}
```

Results in $\frac{3}{6} = 50\%$ of the max\_marks for the question.

Note: We are using "" for no answer for the fill-in-the-blank questions.

### Open-ended:

```json
{
    "answer": "No, writing the requirements is no fun."
}
```

Results in $\frac{0}{1} = 0\%$ of the max\_marks for the question.

# Changes to existing tables

- **checkpoint\_questions** table

  - remove **challenge\_id** column  
    - This is not needed anymore, as the questions are now associated with checkpoints through the **checkpoint\_question\_slots** table, which in turn is associated with sections of checkpoints.  
  - remove **variant**  
    - We do not need this.  
  - remove **answer\_config** column  
    - This is not needed anymore, as the answer configuration is part of the **content** field.  
  - change type of **id** column to *bigserial*  
    - This allows for more questions in the future, as we can have up to 18 quintillion questions.  
  - remove **points** column (we use **max\_marks** for the question\_slot instead)  
- **checkpoint\_answers** table

  - add **mark\_numerator** *int8*  
  - add **mark\_denominator** *int8*  
  - add **mentor\_mark\_numerator** *int8*  
  - add **mentor\_mark\_denominator** *int8*  
    - This allows us to store the mentor's mark as a rational number, which can be useful for more precise grading.  
    - The numerator and denominator can be used to calculate the final mark, this way we can represent even marks like 1/3 without losing precision.  
  - add **evaluation\_text** *varchar*  
    - This allows the mentor to provide an explanation for the mark given. Also allows an LLM in the auto-evaluation to provide an explanation for the mark given.  
  - add **evaluation\_flag** int4  
    - This allows an LLM to flag various issues with an answer, such as perhaps  
      - the answer might be ai-generated  
      - the answer is identical to an answer of another student  
      - the answer contains instructions or inappropriate content etc.  
  - add **updated\_at** *timestamptz*  
    - This allows us to track when the answer was last updated.

# Notes

- Serial and Bigserial are just auto-incrementing integer types in PostgreSQL.

  - Serial is a 4-byte integer (int4), while Bigserial is an 8-byte integer (int8).  
  - If we expect a large number of entries, we should use Bigserial for the IDs.  
  - For example, if we (theoretically) expect to have more than 2 billion entries in the **checkpoint\_questions** table, we should use Bigserial for the question\_id.  
- Apparently, postgresql can do some nice indexing shenanigans with jsonb fields, so we can use jsonb for the content field in the **checkpoint\_questions** table.

  - This allows us to store complex data structures in a single field and still be able to query them efficiently.  
  - However, this may not be the best choice for all use cases, as it can make querying more complex and less efficient.  
- Maybe sections should also store marks ... but that's not strictly necessary