export type GroupStudentMap={
    studentId: number,
    incidentCount: number,
}

export interface GroupStudentMapping{
    [groupId: string]: [GroupStudentMap];
}