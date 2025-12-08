export interface Expert {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  rating: number;
  imageUrl: string;
  availability: 'available' | 'busy' | 'offline';
  consultationPrice: number;
  languages: string[];
  bio: string;
}

export interface ConsultationMessage {
  id: string;
  text: string;
  sender: 'expert' | 'user';
  timestamp: Date;
  attachments?: Array<{
    type: 'image' | 'document';
    url: string;
    name: string;
  }>;
}

export interface Consultation {
  id: string;
  expertId: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  startTime?: Date;
  endTime?: Date;
  messages: ConsultationMessage[];
}

export class ExpertService {
  static async getExperts(): Promise<any[]> {
    try {
      const response = await fetch('http://10.0.2.2:3000/api/experts', {
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const experts = await response.json();

      // Transform backend response with null-safe defaults
      return experts.map((expert: any) => {
        const specialtyValue = expert.specializations?.[0] || 'General Expert';
        const nameValue = `${expert.user?.first_name || ''} ${expert.user?.last_name || ''}`.trim() || 'Unknown Expert';

        return {
          id: expert.id || '',
          name: nameValue,
          specialty: specialtyValue,
          specialization: specialtyValue,
          image: expert.profileImage || expert.profile_image || 'https://via.placeholder.com/150',
          imageUrl: expert.profileImage || expert.profile_image || 'https://via.placeholder.com/150',
          rating: expert.rating || 0,
          experience: `${expert.experience || 0} years`,
          consultationFee: expert.hourlyRate || expert.hourly_rate || 0,
          consultationPrice: expert.hourlyRate || expert.hourly_rate || 0,
          languages: expert.languages || ['French'],
          bio: expert.bio || 'Expert agricultural consultant',
          certifications: expert.certifications ?
            (typeof expert.certifications === 'string' ? [expert.certifications] :
              Array.isArray(expert.certifications) ? expert.certifications :
                Object.values(expert.certifications || {})) : [],
          availability: {
            days: expert.availability?.schedule ?
              Object.keys(expert.availability.schedule).filter((day: string) =>
                expert.availability.schedule[day]?.start
              ).map((day: string) => day.charAt(0).toUpperCase() + day.slice(1)) :
              ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            hours: expert.availability?.schedule?.monday ?
              `${expert.availability.schedule.monday.start} - ${expert.availability.schedule.monday.end}` :
              '9:00 AM - 5:00 PM'
          }
        };
      });
    } catch (error) {
      console.error('Failed to fetch experts:', error);
      return [];
    }
  }

  static async startConsultation(expertId: string): Promise<Consultation> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      id: Math.random().toString(36).substring(2),
      expertId,
      status: 'in-progress',
      startTime: new Date(),
      messages: []
    };
  }

  static async sendMessage(
    consultationId: string,
    message: string,
    attachments?: Array<{ type: 'image' | 'document'; url: string; name: string; }>
  ): Promise<ConsultationMessage> {
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      id: Math.random().toString(36).substring(2),
      text: message,
      sender: 'user',
      timestamp: new Date(),
      attachments
    };
  }

  static async endConsultation(consultationId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}