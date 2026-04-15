export interface User {
  id: string;
  username: string;
  role: 'admin' | 'athlete';
  groupId: string | null;
  groupName?: string | null;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  order: number;
}

export interface Route {
  id: string;
  name: string;
  category: 'qualification' | 'bonus' | 'finale';
  points: number;
  order: number;
  completed?: boolean;
}

export interface Config {
  qualificationBestCount: number;
  finaleMaxAthletes: number;
}

export interface AthleteResult {
  userId: string;
  username: string;
  qualCompleted: number;
  bonusCompleted: number;
  qualPoints: number;
  bonusPoints: number;
  totalPoints: number;
  routes: {
    routeId: string;
    name: string;
    points: number;
    completed: boolean;
  }[];
}

export interface GroupResult {
  groupId: string;
  groupName: string;
  athletes: AthleteResult[];
}
