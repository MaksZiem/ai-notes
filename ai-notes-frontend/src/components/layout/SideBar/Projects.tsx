import { Folder, Plus } from "lucide-react";
import Section from "./Section";
import { useNavigate } from "react-router-dom";
import type { Project } from "../../../types/project";
import { formatDate } from "../../../utils/formatDate";

const PROJECT_DEFAULT_COLOR = "#6366f1";

export default function Projects({ projects, loading = false }: { projects: Project[]; loading?: boolean }) {
  const navigate = useNavigate();
  return (
    <Section label="Projekty" icon={<Folder size={13} />} defaultOpen>
      <div className="flex flex-col gap-px mt-0.5">
        {loading ? (
          <p className="pl-7 py-2 text-xs text-gray-600">Ładowanie...</p>
        ) : (
          projects.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/notes?projectId=${p.id}`)}
              className="w-full flex items-center gap-2 pl-7 pr-2.5 py-1.5 rounded-lg text-[12.5px] text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-colors duration-100 text-left"
            >
              <span
                className="w-2 h-2 rounded-sm flex-shrink-0"
                style={{ backgroundColor: p.color ?? PROJECT_DEFAULT_COLOR }}
              />
              <span className="flex-1 truncate">{p.name}</span>
              <span className="text-[10.5px] text-gray-600 flex-shrink-0">
                {formatDate(p.updatedAt)}
              </span>
            </button>
          ))
        )}
        <button
          onClick={() => navigate("/projects")}
          className="flex items-center gap-2 pl-7 py-1.5 text-xs text-gray-600 hover:text-indigo-400 transition-colors duration-150"
        >
          <Plus size={12} />
          Nowy projekt
        </button>
      </div>
    </Section>
  );
}
