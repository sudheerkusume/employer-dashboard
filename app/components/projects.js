"use client";
import { useParams } from "next/navigation";
import { realEstateData } from "./config/data";
import ProjectDetailsPage from "./projects/projectdetails";

export default function ExploreProjects() {
    const { project_id } = useParams();
    const project = realEstateData.find(item => item.id === Number(project_id))
    return (
        <div className="bg-white">
            <ProjectDetailsPage project={project} />
        </div>
    );
}
