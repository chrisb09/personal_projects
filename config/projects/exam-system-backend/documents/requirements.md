# **ADVANCED WEB TECHNOLOGIES LAB: ALFA GREEN LMS**

# **REQUIREMENTS DOCUMENT**

15/05/2025

# 

## **Authors:**

* Astrid  
* Azim  
* Christian Brinkmann  
* Kristina  
* Linecker  
* Luyang  
* Rein  
* Younnes

# **VERSION HISTORY**

| Version | Date | Comments |
| :---- | :---- | :---- |
| v1 | 2025-05-13 | First version, setup |
| v1.1 | 2015-05-15 | Added version history |
|  |  |  |
|  |  |  |
|  |  |  |

## **TABLE OF CONTENTS** {#table-of-contents}

[TABLE OF CONTENTS	2](#table-of-contents)

[**1\. INTRODUCTION	4**](#1.-introduction)

[1.1 Purpose	5](#1.1-purpose)

[1.2 Terms	5](#1.2-terms)

[**2\. OVERALL DESCRIPTION	6**](#2.-overall-description)

[2.1 Product Perspective	7](#2.1-product-perspective)

[2.1 User Classes and Characteristics:	7](#2.1-user-classes-and-characteristics:)

[2.2 Product Functions	7](#2.2-product-functions)

[**3\. REQUIREMENTS: TEACHER VIEW	8**](#3.-requirements:-teacher-view)

[3.1 Creating a Checkpoint	9](#3.1-creating-a-checkpoint)

[3.1.1 Checkpoint Configuration Page	9](#3.1.1-checkpoint-configuration-page)

[3.1.2 Adding Questions	9](#3.1.2-adding-questions)

[3.1.3 Question Types	9](#3.1.3-question-types)

[3.1.4 Checkpoint Variants	10](#3.1.4-checkpoint-variants)

[3.1.5 Points and Skill Weights for Question Slots	10](#3.1.5-points-and-skill-weights-for-question-slots)

[3.1.6 Programmatic Generation of Variants	11](#3.1.6-programmatic-generation-of-variants)

[3.1.6 Variants of Single Choice Questions	11](#3.1.6-variants-of-single-choice-questions)

[3.1.7 Variants of Multiple Choice Questions	12](#3.1.7-variants-of-multiple-choice-questions)

[3.1.8 Open Ended Questions	13](#3.1.8-open-ended-questions)

[3.1.9 Drag and Drop/Lückentext Questions	13](#3.1.9-drag-and-drop/lückentext-questions)

[3.1.10 Sections	13](#3.1.10-sections)

[3.2 Assembling a Checkpoint	14](#3.2-assembling-a-checkpoint)

[3.3 Teacher Dashboard	14](#3.3-teacher-dashboard)

[3.3.1 Overview Section	14](#3.3.1-overview-section)

[3.3.2 Checkpoint Status Categories	14](#3.3.2-checkpoint-status-categories)

[3.3.3 Notifications	14](#3.3.3-notifications)

[3.4. Checkpoint Management	14](#3.4.-checkpoint-management)

[3.4.1 Checkpoint Actions (per checkpoint)	15](#3.4.1-checkpoint-actions-\(per-checkpoint\))

[3.4.2 Creation Workflow	15](#3.4.2-creation-workflow)

[3.5 Grading and Review	15](#3.5-grading-and-review)

[3.5.1 Review Modes	15](#3.5.1-review-modes)

[3.5.2 Review	16](#3.5.2-review)

[3.5.3 Navigation Tools	16](#3.5.3-navigation-tools)

[3.5.4 Calculating percentages for skills	16](#3.5.4-calculating-percentages-for-skills)

[3.5.5 Grading of Open Ended Question	17](#3.5.5-grading-of-open-ended-question)

[3.5.6 Grading of Single Choice, Multiple Choice and Drag and Drop Questions	17](#3.5.6-grading-of-single-choice,-multiple-choice-and-drag-and-drop-questions)

[3.6. Publishing Results	18](#3.6.-publishing-results)

[3.6.1 Final Steps	18](#3.6.1-final-steps)

[3.6.2 Summary Analytics	18](#3.6.2-summary-analytics)

[3.5. Additional Features (Nice to Have)	18](#3.5.-additional-features-\(nice-to-have\))

[3.6.1 Notifications Panel	18](#3.6.1-notifications-panel)

[**4\. MANDATORY REQUIREMENTS: STUDENT VIEW	19**](#4.-mandatory-requirements:-student-view)

[4.1 Taking an Exam	20](#4.1-taking-an-exam)

[4.1.1 Overview Section	20](#4.1.1-overview-section)

[4.1.3 Taking Exam	20](#4.1.3-taking-exam)

[4.2 Reviewing an Exam	21](#4.2-reviewing-an-exam)

[4.1.3 Grade	21](#4.1.3-grade)

## 

# 

# 

# 

# 

# 

# 

# 

# 

# 

# **1\. INTRODUCTION** {#1.-introduction}

## **1.1 Purpose** {#1.1-purpose}

The purpose of this document is to define the requirements and scope for the Alfa Green LMS Lab project. The general purpose of this activity is to add checkpoints to the existing application, alongside generation of variant tests.

## **1.2 Terms** {#1.2-terms}

| Term | Definition |
| :---: | :---: |
| Checkpoint | A checkpoint is a test that a student takes and creates |
| Question | A question is a task on a checkpoint that a student takes. |
| Nice To Have Requirements | Secondary Requirements that will be taken up after the core requirements are met |

# 

# 

# 

# 

# 

# 

# 

# 

# **2\. OVERALL DESCRIPTION** {#2.-overall-description}

## **2.1 Product Perspective** {#2.1-product-perspective}

	The enhancements outlined in this document will serve as an addition to the existing Alfa Green LMS WebApp. The app uses a [Node.JS](http://Node.JS) backend and a [React.JS](http://React.JS) Frontend. This document is accompanied by views, which serve as a baseline for the functionality and design. The style scheme followed will be the same as the current app.

## **2.1 User Classes and Characteristics:** {#2.1-user-classes-and-characteristics:}

* Student: A student attempts a checkpoint   
* Teacher: A teacher creates a checkpoint and assigns it to students

## **2.2 Product Functions** {#2.2-product-functions}

(Should insert UML use case diagrams here)  
	Broadly, these are the functions of the app

* Teacher Dashboard  
* Checkpoint Creation  
* Question Creation  
* Checkpoint Assembling  
* Assigning Checkpoint to Students  
* Publishing the Checkpoint  
* Resolving Student Objections  
* Publishing Final Grades  
* Student Starting an Exam  
* Student Answering the Questions  
* Student Submitting the Exam  
* Student Starting the Exam Review  
* Student Submitting the Review

# 

# 

# 

# 

# 

# **3\. REQUIREMENTS: TEACHER VIEW** {#3.-requirements:-teacher-view}

## **3.1 Creating a Checkpoint** {#3.1-creating-a-checkpoint}

### **3.1.1 Checkpoint Configuration Page** {#3.1.1-checkpoint-configuration-page}

Checkpoint configuration page will have the ability to:

* Name a checkpoint  
* Set the duration of a checkpoint  
* Set the start and end date of a checkpoint  
* Set whether the sections of the checkpoint can be randomized in order.  
* Set the dependencies of the checkpoint.   
* Set the skills option:  
  Option 1 \= ‘equal skill weights for each task’:  the weights for the skills will be automatically distributed depending on the number of question slots, e.g., if you have two question slots, both will get a skill weight of 0.5 (50%) for every specified skill assigned to them  
  Option 2 \= ‘assign weights to each skill for each task’: in the view where the questions are assembled for the checkpoint, the teacher assigns one weight to each skill for each individual question slot manually  
  Option 3 \= ‘assign weights to specific skill for each task’:  in the view where the questions are assembled for the checkpoint the teacher selects a set of skills for each question slot from the list and assign weights to the selected skills for the question slot  
  Option 4 \= ‘no skills’: there are no skills associated with the checkpoint  
* The teacher can either add an existing skill to the checkpoint or create a new one by specifying a name for it and add it to the list of skills for the checkpoint.

### **3.1.2 Adding Questions** {#3.1.2-adding-questions}

	While creating a checkpoint, pre-existing questions can be added, or new questions can be generated. Pre-existing questions can be added through a search functionality. The search can be performed on the basis of Question Type, Question Text, Question Tag and Question Author.

### **3.1.3 Question Types** {#3.1.3-question-types}

	Along with all questions, the teacher will have the ability to add text and optionally images. The following question types are supported:

* Single Correct Questions: N total choices  
* Multiple Correct Questions: N total choices  
* Open Ended Questions: Questions with a textbox for an answer.  
* Drag and Drop Questions: Resembling Lückentext

2 

### **3.1.4 Checkpoint Variants** {#3.1.4-checkpoint-variants}

	Checkpoint variants can be created by the teacher in two ways:

1. Explicitly provide variant questions that can be used in place of a particular question: Applicable for all question types  
2. Provide additional inputs (Formula, Constrains, values) to generate additional questions programmatically: Applicable only for single and multiple choice question types.

Post programmatic generation of variants, the teacher will be presented with the generated variants to double-check their veracity.

### **3.1.5 Points and Skill Weights for Question Slots** {#3.1.5-points-and-skill-weights-for-question-slots}

All questions within a question slot share the same points and skill weights. Regardless of the checkpoint configuration settings, each question slot receives a points value, which is a positive number that must be manually specified by the teacher. These points are used to grade the questions: if a student answers a question correctly, they receive all the points for that question slot. In addition to the points specified by the teacher, we automatically calculate the percentage with respect to all the points at the checkpoint and display it for the teacher. Depending on the skills option chosen in the checkpoint configuration view, the teacher can/must specify skill weights for a question slot (see section 3.1.1, 'Checkpoint Configuration').  
Skill weights are percentages that indicate the importance of a question slot for a skill. To specify a skill weight of 20%, enter 0.2. The sum of the weights for each skill across the entire checkpoint must equal 100%. (For information on how to calculate the percentage obtained for a skill, see Section 3.5.4.)

### **3.1.6 Programmatic Generation of Variants** {#3.1.6-programmatic-generation-of-variants}

	An algorithm to generate variant questions programmatically will be used. Based on certain inputs from the user (as specified in the subsequent sections), variants of certain questions will be able to be generated automatically. 

* Programmatic generation of numerical variants will make use of math input and evaluation libraries, which will replace specific numeric values in the question by randomly generated values, based on constraints, and calculate the correct answer based on the new numeric values.  
* Programmatic generation of non numerical variants will make use of inputs from the user such as a list of correct answers, and corresponding incorrect answers, as specified in sections for each of the question types.

### **3.1.6 Variants of Single Choice Questions** {#3.1.6-variants-of-single-choice-questions}

	The teacher has to provide the following inputs: 

* Numerical Questions: Formula to evaluate the correct answer, based on all the variables.  
* Numerical Questions: Constraints applicable to the variables: Range, Domain (Integers, Reals), Dependency Constraints and Discrete Value Pool.  
* Non Numerical Questions: Tuples of the form (Correct Answer, Incorrect Answers)  
* Number of questions to generate.  
* A maximum of one formula per question can be provided to generate the variants in the initial phase.

The variant questions will be generated during the flow of creation of the checkpoint. Generated variant questions will be able to be used in place of the original question in variant tests.

### **3.1.7 Variants of Multiple Choice Questions** {#3.1.7-variants-of-multiple-choice-questions}

	The teacher has to provide the following inputs:

* For non numerical questions: Tuples of the form (Set of Correct Answers, Set of Wrong Answers). Set of correct answers can have a max of 3 elements. A set of random values will be picked from the set of wrong answers to select a total of n values from both the sets, where n is an input from the user.  
* For numerical questions: The teacher, similar to single correct questions, can enter ‘p’ formulae, where ‘p’ is the number of total correct options. Similarly, constraints (Section 3.1.6) for variables involved in all the formulae can be specified.   
* Number of questions to generate.

The variant questions will be generated during the flow of creation of the checkpoint. Generated variant questions will be able to be used in place of the original question in variant tests.

### **3.1.8 Open Ended Questions** {#3.1.8-open-ended-questions}

	Open Ended Questions text and reference answers can be rephrased through an API of an LLM. The teacher can provide additional input in a single text box, which will be provided to the model within the main prompt to rephrase the question and/or the reference answer.

### **3.1.9 Drag and Drop/Lückentext Questions** {#3.1.9-drag-and-drop/lückentext-questions}

The teacher specifies a Lückentext (fill-in-the-blank text) and uses the underscore symbol to indicate where the blanks should go. For example, like this: My \_dog\_ is really \_cute\_. In this example, blanks are placed at the positions of the words 'dog' and 'cute'.  So, the student would see the text like this: The  is really . The student's task would be to drag and drop the words 'dog' and 'cute' into the correct positions in the text. The teacher can also specify additional items that can be dragged into the blanks to make the task more challenging. For example, the student would then be tasked with dragging two of three displayed items — \[dog\], \[cute\] and \[green\] — into the blanks.  
	

### **3.1.10 Sections** {#3.1.10-sections}

	Questions can be arranged in sections. A section can have a name and common instructions (text and image). All types of questions can be present in a single section.

### **3.1.11 History of Changes** *(Nice to Have)*

	The history of changes for the checkpoint creation is nice to have but not a mandatory requirement. We lay the groundwork for implementing this feature, specifically in regards to the database schema, but delegate the graphical representation and user interface to the future.  
We plan to store every saved version so that it is possible to work with them later to implement this feature fully.

	

## **3.2 Assembling a Checkpoint** {#3.2-assembling-a-checkpoint}

Currently, we assemble a checkpoint at in the same view where questions and sections are added

## **3.3 Teacher Dashboard** {#3.3-teacher-dashboard}

### **3.3.1 Overview Section** {#3.3.1-overview-section}

* Displays a list of current, upcoming, and past checkpoints.  
* Indicates checkpoint timing and availability:  
  * E.g., “Checkpoint 1 (2h) – Start until 4pm today”  
* Shows progress indicators for current/running checkpoints:  
  * E.g., “12/13 started”, “10/13 turned in”  
* Uses color dots for checkpoint status:  
  * Orange: Something is missing  
  * Green: Ready to publish

### **3.3.2 Checkpoint Status Categories** {#3.3.2-checkpoint-status-categories}

* Running: Currently active checkpoints  
* Pending Grading: Checkpoints awaiting review or scoring  
* Upcoming Checkpoints: Chronologically listed by proximity, clicking   
* Pending Student Reviews: Lists checkpoints needing manual feedback

### **3.3.3 Notifications** {#3.3.3-notifications}

* Display student progress, submissions, and completion status.  
* Update teachers about review completions and publishing.

## **3.4. Checkpoint Management** {#3.4.-checkpoint-management}

Clicking the display of upcoming checkpoints leads to this view

### **3.4.1 Checkpoint Actions (per checkpoint)** {#3.4.1-checkpoint-actions-(per-checkpoint)}

* Set Time & Publish  
  * Define earliest/latest starting times  
  * Specify max duration  
* Assign  
  * Assign checkpoint to entire groups or specific students  
* Edit  
  * Change checkpoint content or settings (--\> Checkpoint Creation)  
* Save Assignment & Leave  
  * Store configuration without immediate publishing

### **3.4.2 Creation Workflow** {#3.4.2-creation-workflow}

* “Create New Checkpoint” button available from dashboard.  
  * Leads to Creation of Checkpoint workflow  
* Flow supports:  
  * Adding questions  
  * Defining scoring  
  * Saving drafts  
  * Publishing to students

## **3.5 Grading and Review** {#3.5-grading-and-review}

Grading: First step of grading the checkpoints after the student has taken it  
Review: Reviewing any objections to the initial grading from students

### **3.5.1 Review Modes** {#3.5.1-review-modes}

* Grade per Question: Each question is shown with the answers of every student  
* Grade per Student: The answers to all questions are shown for a single student  
* Review by Student  
* Review by Question

### **3.5.2 Review** {#3.5.2-review}

* Teachers can leave comments per student answer.  
* Visual display:  
  * Template answer  
  * Student response  
  * Grade entry  
  * Auto-graded tag if applicable

### **3.5.3 Navigation Tools** {#3.5.3-navigation-tools}

* Question Overview: Quick access to each question  
* Student Overview: Select individual students  
* Search Fields: Filter questions or students easily  
* Next/Previous Buttons: For sequential navigation

### **3.5.4 Calculating percentages for skills** {#3.5.4-calculating-percentages-for-skills}

**3.5.4.1 Calculating the percentage of a skill obtained**   
	Assume that the checkpoint contains two question slots, QuestionSlot1 and QuestionSlot2, as well as a skill, Skill1, with skill weights of 0.3 and 0.7 for QuestionSlot1 and QuestionSlot2, respectively. Furthermore, assume that the student obtained 4 out of a possible 5 points for QuestionSlot1 and 3 out of a possible 4 points for QuestionSlot2. The percentage of the skill obtained for Skill1 is then calculated as follows: 0.3 × (4/5) \+ 0.7 × (3/4) \= 0.765 (76.5%).  
**3.5.4.2 Calculating the overall skills percentage**   
Assume there are only two skills, with percentages of 30% and 50% respectively. The overall skills percentage is then computed as (0.3 \+ 0.5) / 2 \= 0.4 \= 40%.

### **3.5.5 Grading of Open Ended Question** {#3.5.5-grading-of-open-ended-question}

	A preliminary grading will be done through the use of LLMs (via APIs), if a reference answer has been provided for an Open Ended Question. The LLM will be used to provide a summary of the students answers, and a review whether the student has missed any points mentioned in the reference answer, or if the student has provided any additional points not present in the reference answer.

### **3.5.6 Grading of Single Choice, Multiple Choice and Drag and Drop Questions** {#3.5.6-grading-of-single-choice,-multiple-choice-and-drag-and-drop-questions}

	These question types will be graded automatically. The teacher will be able to view the results of the automatic grading before publishing at the levels described above.

## **3.6. Publishing Results** {#3.6.-publishing-results}

### **3.6.1 Final Steps** {#3.6.1-final-steps}

* After grading (and after reviewing objections), teachers can:  
  * Publish results  
  * Notify students  
    * Via email  
    * Via platform  
  * Export results for external use

### **3.6.2 Summary Analytics** {#3.6.2-summary-analytics}

* Show:  
  * Average score  
  * Median score  
  * Number of results being published

## **3.5. Additional Features** *(Nice to Have)* {#3.5.-additional-features-(nice-to-have)}

### **3.6.1 Notifications Panel** {#3.6.1-notifications-panel}

* Event feed showing recent activity:  
  * Checkpoint completions  
  * Individual reviews  
  * Publishing actions

# 

# 

# 

# 

# 

# 

# 

# 

# 

# 

# **4\. MANDATORY REQUIREMENTS: STUDENT VIEW** {#4.-mandatory-requirements:-student-view}

## **4.1 Taking an Exam** {#4.1-taking-an-exam}

### **4.1.1 Overview Section** {#4.1.1-overview-section}

* Displays a list of current, upcoming, and past exams.  
* Indicates exam time and availability:  
  * E.g., “exam 1 (2h) – Start until 4pm today”  
* Use different colors to denote exam status:  
  * Grey: Not available  
  * Blue: Ready to start

**4.1.2  Start Exam**

* Click Start button to enter introduction page of exam  
  * The Introduction Page shows basic information about the exam, including duration, warning, hint, and etc.

### **4.1.3 Taking Exam** {#4.1.3-taking-exam}

* Click Start button in introduction page and take exam  
* Operations during exam  
  * Answer questions  
  * Flag questions  
  * Take notes about questions to record some steps  
* Automatically save answer in case of network disconnection and overdue  
  * Reconnection Permitted  
* Click Submit button to Submission Page  
  * Overview of unsolved Questions  
  * Flagged questions  
  * Remaining time to deadline  
  * Cancel button to go back to answering page  
  * Submission button to confirm submission and submit results

## **4.2 Reviewing an Exam** {#4.2-reviewing-an-exam}

**4.2.1 Overview Section**

* Displays exams available for review.  
* Indicates exam review time and availability:  
  * E.g., “exam 1 (2h) review – Start until 4pm today”  
  * E.g., “exam 1 (2h) review – End until 6pm today”  
* Use different colors to denote exam review status:  
  * Grey: Expired  
  * Blue: Ready to start

**4.1.2  Start Exam Review**

* Click Start button to start inspection  
* Choose each question to check points awarded and solution  
* Report any doubt about points awarded and waiting for teacher’s response  
* Click Submission button to end exam review

### **4.1.3 Grade** {#4.1.3-grade}

* Click any exam to see final grade after inspection or grade before inspection

