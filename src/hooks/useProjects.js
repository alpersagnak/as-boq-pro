import { useEffect, useState } from "react";

const STORAGE_KEY = "as-boq-pro-projects";

function createId() {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

export function useProjects() {
  const [projects, setProjects] = useState(() => {
    try {
      const savedProjects = localStorage.getItem(STORAGE_KEY);
      return savedProjects ? JSON.parse(savedProjects) : [];
    } catch {
      return [];
    }
  });

  const [activeProjectId, setActiveProjectId] = useState(() => {
    return localStorage.getItem("as-boq-pro-active-project") || "";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(
      "as-boq-pro-active-project",
      activeProjectId
    );
  }, [activeProjectId]);

  const activeProject =
    projects.find((project) => project.id === activeProjectId) ||
    projects[0] ||
    null;

  function addProject(projectData) {
    const newProject = {
      id: createId(),
      name: projectData.name.trim(),
      code: projectData.code.trim(),
      client: projectData.client.trim(),
      location: projectData.location.trim(),
      currency: projectData.currency,
      vatPercent: Number(projectData.vatPercent) || 0,
      status: projectData.status,
      createdAt: new Date().toISOString(),
      boqRows: [],
      progressPayments: [],
    };

    setProjects((currentProjects) => [
      ...currentProjects,
      newProject,
    ]);

    setActiveProjectId(newProject.id);

    return newProject;
  }

  function deleteProject(projectId) {
    setProjects((currentProjects) =>
      currentProjects.filter(
        (project) => project.id !== projectId
      )
    );

    if (activeProjectId === projectId) {
      setActiveProjectId("");
    }
  }

  return {
    projects,
    activeProject,
    activeProjectId,
    setActiveProjectId,
    addProject,
    deleteProject,
  };
}