import { useProjects } from "../context/ProjectContext";
import { DISCIPLINES } from "../data/disciplines";

export default function Topbar({ title, subtitle }) {
  const { state, activeProject, activeDiscipline, dispatch } = useProjects();
  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="topbar-selectors">
        <label>
          <span>Proje</span>
          <select
            value={activeProject?.id || ""}
            onChange={(event) =>
              dispatch({ type: "SET_ACTIVE_PROJECT", projectId: event.target.value })
            }
          >
            {state.projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Disiplin / Ekip</span>
          <select
            value={activeDiscipline}
            onChange={(event) =>
              dispatch({ type: "SET_ACTIVE_DISCIPLINE", disciplineId: event.target.value })
            }
          >
            {DISCIPLINES.map((discipline) => (
              <option key={discipline.id} value={discipline.id}>{discipline.label}</option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );
}
