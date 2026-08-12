import { Folder, Plus } from "lucide-react";
import Section from "./Section";
import { useNavigate } from "react-router-dom";
import type { Project2 } from "./SideBar";

export default function Projects({projects} : {projects: Project2[]}) {
  const navigate = useNavigate();
  return (
    <Section label="Projekty" icon={<Folder size={13} />} defaultOpen>
      <div className="flex flex-col gap-px mt-0.5">
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate("/projects")}
            className="w-full flex items-center gap-2 pl-7 pr-2.5 py-1.5 rounded-lg text-[12.5px] text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-colors duration-100 text-left"
          >
            <span className={`w-2 h-2 rounded-sm flex-shrink-0 ${p.color}`} />
            <span className="flex-1 truncate">{p.name}</span>
            <span className="text-[10.5px] text-gray-600 flex-shrink-0">
              {p.updatedAt}
            </span>
          </button>
        ))}
        <button className="flex items-center gap-2 pl-7 py-1.5 text-xs text-gray-600 hover:text-indigo-400 transition-colors duration-150">
          <Plus size={12} />
          Nowy projekt
        </button>
      </div>
    </Section>
  );
}
