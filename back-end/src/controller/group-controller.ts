import { NextFunction, Request, Response } from "express"
import { getRepository,getManager} from "typeorm"
import { GroupStudent } from "../entity/group-student.entity"
import { Group } from "../entity/group.entity"
import { CreateGroupInput, UpdateGroupInput } from "../interface/group.interface"
import { CreateStudentGroupInput } from "../interface/student-group.interface"
import { GroupStudentMapping } from "../interface/group-student-map.interface"

export class GroupController {
  private groupRepository = getRepository(Group)
  private studentGroupRepository = getRepository(GroupStudent)
  private entityManager = getManager()

  async allGroups(request: Request, response: Response, next: NextFunction) {
    return this.groupRepository.find()
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
    const {
      body: group,
      params: { id },
    } = request

    let updateGroupInput: UpdateGroupInput
    let groupToUpdate = await this.groupRepository.findOne(id)
    if (groupToUpdate) {
      updateGroupInput = {
        id: Number(id),
        name: group.name,
        number_of_weeks: group.number_of_weeks,
        roll_states: group.roll_states,
        incidents: group.incidents,
        ltmt: group.ltmt,
      }
      groupToUpdate.prepareToUpdate(updateGroupInput)
      return this.groupRepository.save(groupToUpdate)
    }

    return { message: "Error in fetching the required resource" }
  }

  async removeGroup(request: Request, response: Response, next: NextFunction) {
    const {
      params: { id },
    } = request
    let groupToDelete = await this.groupRepository.findOne(id)
    if (groupToDelete) {
      return await this.groupRepository.remove(groupToDelete)
    }
    return { message: "The Requested Resource doesnt exist" }
  }

  async getGroupStudents(request: Request, response: Response, next: NextFunction) {
    return await this.entityManager.query(`select id,first_name,last_name, first_name  ||' '|| last_name as full_name from student where id in (select student_id from group_student);`)
  }

  async runGroupFilters(request: Request, response: Response, next: NextFunction) {

    let allGroups = await this.groupRepository.find()
    if (allGroups && allGroups.length) {
      let queryDefinition = (date: string, rollState: string, incidents: number, ltmtFilter: string): string =>
        `select studentId,count(*) as incidentCount from ( select srs.student_id as studentId,srs.roll_id as rollId,srs.state as rollState, roll.completed_at as date from student_roll_state srs inner join roll on roll.id=srs.roll_id where date>=${date}  and rollState='${rollState}') group by studentId having incidentCount ${ltmtFilter}${incidents};`
      let requiredDate = (week: number): string => {
        let date = new Date()
        date.setDate(date.getDate() - week * 7)
        return date.toISOString().split("T")[0]
      }
      let groupUpdateObject: { id: number; run_at: string; student_count: number }[] = []
      let studentGroupCreateObject: CreateStudentGroupInput[] = []
      let groupStudentMap: GroupStudentMapping = {}

      /* can't reuse service level methods here among each other 
    due to bad pattern of mixing route level methods and service level methods which should be pure methods
    without middleware level req/res/next parameter dependency

    let allGroups=this.allGroups()
    
    */
      
      for (const group of allGroups) {
        groupStudentMap[group.id] = await this.entityManager.query(queryDefinition(requiredDate(group.number_of_weeks), group.roll_states, group.incidents, group.ltmt))
      }

      for (let key in groupStudentMap) {
        let groupObj = { id: Number(key), run_at: requiredDate(0), student_count: groupStudentMap[key].length }
        if (groupStudentMap[key].length) {
          groupStudentMap[key].forEach((info) => {
            let studentGroupObj = { group_id: Number(key), student_id: info.studentId, incident_count: info.incidentCount }
            studentGroupCreateObject.push(studentGroupObj)
          })
        }
        groupUpdateObject.push(groupObj)
      }

      //TODO: wrap the below DB calls in a transaction
      await this.studentGroupRepository.clear()
      await this.groupRepository.save(groupUpdateObject)
      await this.studentGroupRepository.save(studentGroupCreateObject)

      return { success: true, message: "The group filters have been successfully implemented" }
    }
    return { message: 'There are no group defined currently, please create the group definitions' };
  }
}
