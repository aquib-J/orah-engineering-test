import { NextFunction, Request, Response } from "express"
import { getRepository } from "typeorm"
import { Group } from "../entity/group.entity"
import { CreateGroupInput, UpdateGroupInput } from "../interface/group.interface"

export class GroupController {
  private groupRepository = getRepository(Group);

  async allGroups(request: Request, response: Response, next: NextFunction) {
    return this.groupRepository.find();
  }

  async createGroup(request: Request, response: Response, next: NextFunction) {
    const { body: group } = request

    const createGroupInput: CreateGroupInput = {
      name: group.name,
      number_of_weeks: group.number_of_weeks,
      roll_states: group.roll_states,
      incidents: group.incidents,
      ltmt: group.ltmt,
      student_count: group.student_count || 0,
    }

    const newGroup = new Group()
    newGroup.prepareToCreate(createGroupInput)

    return this.groupRepository.save(newGroup)
  }

  async updateGroup(request: Request, response: Response, next: NextFunction) {
    // Task 1: 
    
    // Update a Group
  }

  async removeGroup(request: Request, response: Response, next: NextFunction) {
    // Task 1: 
    
    // Delete a Group
  }

  async getGroupStudents(request: Request, response: Response, next: NextFunction) {
    // Task 1: 
        
    // Return the list of Students that are in a Group
  }


  async runGroupFilters(request: Request, response: Response, next: NextFunction) {
    // Task 2:
  
    // 1. Clear out the groups (delete all the students from the groups)

    // 2. For each group, query the student rolls to see which students match the filter for the group

    // 3. Add the list of students that match the filter to the group
  }
}
