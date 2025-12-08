export interface Expert {
  id: string;
  name: string;
  specialty: string;
  image: string;
  rating: number;
  experience: string;
  consultationFee: number;
  bio: string;
  languages: string[];
  certifications: string[];
  availability: {
    days: string[];
    hours: string;
  };
}