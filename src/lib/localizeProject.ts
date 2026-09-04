import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import type { Project } from '@/types/project';

export function getLocalizedProject(project: Project, currentLang?: string): Project {
  if (!project) return project;
  const langKey = (currentLang || i18n.language || 'en').split('-')[0];
  if (langKey === 'en') {
    return project;
  }

  // Look up translated entry for this project from bundled i18n resources
  const bundle = i18n.getResourceBundle(langKey, 'projects') || {};
  const trans = bundle[project.id];
  if (!trans) {
    return project;
  }

  return {
    ...project,
    name: trans.name || project.name,
    tagline: trans.tagline || project.tagline,
    description: trans.description || project.description,
    purpose: trans.purpose || project.purpose,
    strengths: (Array.isArray(trans.strengths) && trans.strengths.length > 0) ? trans.strengths : project.strengths,
    limitations: (Array.isArray(trans.limitations) && trans.limitations.length > 0) ? trans.limitations : project.limitations,
    expertise: (Array.isArray(trans.expertise) && trans.expertise.length > 0) ? trans.expertise : project.expertise,
    roadmap: (Array.isArray(trans.roadmap) && trans.roadmap.length > 0) ? trans.roadmap : project.roadmap,
    relatedProjects: project.relatedProjects?.map((rel, idx) => {
      const transItem = trans.relatedProjects?.find ? trans.relatedProjects.find((r: any) => r.index === idx) : null;
      const transRel = transItem?.relation || trans.relatedProjects?.[idx]?.relation || trans.relatedProjects?.[idx];
      return transRel ? { ...rel, relation: typeof transRel === 'string' ? transRel : transRel.relation || rel.relation } : rel;
    }),
    repos: project.repos?.map((repo, idx) => {
      const transItem = trans.repos?.find ? trans.repos.find((r: any) => r.index === idx) : null;
      const transDesc = transItem?.description || trans.repos?.[idx]?.description;
      return transDesc ? { ...repo, description: transDesc } : repo;
    }),
    mirrors: project.mirrors?.map((mirror, idx) => {
      const transItem = trans.mirrors?.find ? trans.mirrors.find((m: any) => m.index === idx) : null;
      const transDesc = transItem?.description || trans.mirrors?.[idx]?.description;
      return transDesc ? { ...mirror, description: transDesc } : mirror;
    }),
    modelReleases: project.modelReleases?.map((model, idx) => {
      const transItem = trans.modelReleases?.find ? trans.modelReleases.find((m: any) => m.index === idx) : null;
      const transDesc = transItem?.description || trans.modelReleases?.[idx]?.description;
      return transDesc ? { ...model, description: transDesc } : model;
    }),
  };
}

export function useLocalizedProjects(projects: Project[]): Project[] {
  const { i18n } = useTranslation();
  return useMemo(() => {
    return projects.map(p => getLocalizedProject(p, i18n.language));
  }, [projects, i18n.language]);
}

export function useLocalizedProject(project: Project | null | undefined): Project | null {
  const { i18n } = useTranslation();
  return useMemo(() => {
    if (!project) return null;
    return getLocalizedProject(project, i18n.language);
  }, [project, i18n.language]);
}
