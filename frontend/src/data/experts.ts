import { Expert } from '../types/experts';

export const sampleExperts: Expert[] = [
  {
    id: 'e1',
    name: 'Dr. Sarah Johnson',
    specialty: 'Crop Disease Specialist',
    rating: 4.8,
    experience: '15 years',
    image: 'https://picsum.photos/200/300?random=1',
    languages: ['English', 'Hindi'],
    bio: 'Expert in identifying and treating various crop diseases. Specialized in sustainable farming practices.',
    certifications: ['PhD in Plant Pathology', 'Certified Agricultural Consultant'],
    consultationFee: 500,
    availability: {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      hours: '9:00 AM - 5:00 PM'
    }
  },
  {
    id: 'e2',
    name: 'Dr. Rajesh Kumar',
    specialty: 'Soil Expert',
    rating: 4.9,
    experience: '12 years',
    image: 'https://picsum.photos/200/300?random=2',
    languages: ['Hindi', 'English', 'Punjabi'],
    bio: 'Specialized in soil health management and organic farming techniques.',
    certifications: ['MSc in Soil Science', 'Organic Farming Certification'],
    consultationFee: 450,
    availability: {
      days: ['Monday', 'Wednesday', 'Friday'],
      hours: '10:00 AM - 6:00 PM'
    }
  },
  {
    id: 'e3',
    name: 'Dr. Emily Chen',
    specialty: 'Agricultural Technology',
    rating: 4.7,
    experience: '8 years',
    image: 'https://picsum.photos/200/300?random=3',
    languages: ['English', 'Mandarin'],
    bio: 'Expert in modern farming technologies and precision agriculture.',
    certifications: ['PhD in Agricultural Engineering', 'Smart Farming Specialist'],
    consultationFee: 600,
    availability: {
      days: ['Tuesday', 'Thursday'],
      hours: '11:00 AM - 7:00 PM'
    }
  },
  {
    id: 'e4',
    name: 'Dr. Mohammed Ali',
    specialty: 'Irrigation Expert',
    rating: 4.6,
    experience: '10 years',
    image: 'https://picsum.photos/200/300?random=4',
    languages: ['English', 'Arabic', 'Hindi'],
    bio: 'Specialized in water management and efficient irrigation systems.',
    certifications: ['Water Management Expert', 'Sustainable Irrigation Specialist'],
    consultationFee: 500,
    availability: {
      days: ['Wednesday', 'Thursday', 'Saturday'],
      hours: '8:00 AM - 4:00 PM'
    }
  },
];