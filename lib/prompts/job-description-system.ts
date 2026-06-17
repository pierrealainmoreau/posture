import type { ContractType, SeniorityLevel } from "@/lib/types";
import { CONTRACT_LABELS, SENIORITY_LABELS } from "@/lib/types";

export function buildJobDescriptionSystemPrompt(params: {
  jobTitle: string;
  contractType: ContractType;
  seniority: SeniorityLevel;
  department?: string;
  teamContext?: string;
  keyMissions: string;
  technicalSkills?: string;
  softSkills?: string;
  perks?: string;
}): string {
  const lines = [
    `Tu es un expert RH spécialisé dans la rédaction de fiches de poste attractives et précises.`,
    ``,
    `Rédige une fiche de poste professionnelle en français pour :`,
    `- Poste : ${params.jobTitle}`,
    `- Contrat : ${CONTRACT_LABELS[params.contractType]}`,
    `- Expérience : ${SENIORITY_LABELS[params.seniority]}`,
  ];

  if (params.department) lines.push(`- Équipe / Département : ${params.department}`);
  if (params.teamContext) lines.push(`- Contexte : ${params.teamContext}`);
  lines.push(`- Missions principales : ${params.keyMissions}`);
  if (params.technicalSkills) lines.push(`- Compétences techniques : ${params.technicalSkills}`);
  if (params.softSkills) lines.push(`- Qualités humaines : ${params.softSkills}`);
  if (params.perks) lines.push(`- Ce que nous offrons : ${params.perks}`);

  lines.push(
    ``,
    `Réponds UNIQUEMENT avec un JSON valide, sans bloc markdown, sans commentaires, suivant exactement ce schéma :`,
    `{`,
    `  "missions": {`,
    `    "intro": "phrase d'accroche courte pour la section missions (1 phrase)",`,
    `    "items": ["mission 1", "mission 2", ...]`,
    `  },`,
    `  "competences": {`,
    `    "intro": "phrase d'introduction courte pour la section compétences (1 phrase)",`,
    `    "required": ["compétence indispensable 1", ...],`,
    `    "nice_to_have": ["compétence appréciée 1", ...]`,
    `  }`,
    `}`,
    ``,
    `Règles :`,
    `- 5 à 8 missions, chacune commençant par un verbe à l'infinitif`,
    `- 4 à 6 compétences requises, 2 à 4 appréciées`,
    `- Ton professionnel mais humain, adapté au type de contrat et au niveau d'expérience`,
    `- Missions concrètes et actionnables, compétences réalistes`,
  );

  return lines.join("\n");
}
