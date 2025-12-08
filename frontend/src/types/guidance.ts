export interface GuidanceSubsection {
  id: string;
  title: string;
  description: string;
  image: string;
}

export interface GuidanceSection {
  id: string;
  title: string;
  icon: string;
  subsections: GuidanceSubsection[];
}