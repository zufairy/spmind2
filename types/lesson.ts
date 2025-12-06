export type Lesson = {
  id: string;
  status: 'In Progress' | 'Completed' | 'Planned';
  priority: 'High' | 'Medium' | 'Low';
  title: string;
  summary: string;       // short preview text
  progress: number;      // 0..100
  details?: string;      // back side text (notes/links)
  subject: string;
  emoji: string;
};
