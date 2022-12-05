export interface CreateGroupInput {
  name: string
  number_of_weeks: number
  roll_states: string
  incidents: number
  ltmt: string
  student_count: number
}

export interface UpdateGroupInput {
  id: number
  name: string
  number_of_weeks: number
  roll_states: string
  incidents: number
  ltmt: string
}
