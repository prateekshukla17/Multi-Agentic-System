import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { error } from 'console';
import { Model } from 'mongoose';
import {
  Leave,
  LeaveDocument,
  LeaveType,
  LeaveStatus,
} from 'src/database/schemas/leave.schema';
import { z } from 'zod';

export const AddLeaveSchema = z.object({
  employeeName: z.string().min(1, 'Employee name is required'),
  leaveType: z.enum(['sick', 'vacation', 'personal', 'parental', 'unpaid']),
  startDate: z.string().describe('Format: YYYY-MM-DD'),
  endDate: z.string().describe('Format: YYYY-MM-DD'),
  reason: z.string().min(1, 'Reason is required'),
});

type LeaveOutput = {
  success: boolean;
  message: string;
};

export type AddLeaveInput = z.infer<typeof AddLeaveSchema>;

@Injectable()
export class LeaveToolService {
  constructor(
    @InjectModel(Leave.name) private leaveModel: Model<LeaveDocument>,
  ) {}
  async addLeaveRequest(input: AddLeaveInput): Promise<LeaveOutput> {
    try {
      const validateInput = AddLeaveSchema.parse(input);
      const startDate = new Date(validateInput.startDate);
      const endDate = new Date(validateInput.endDate);

      if (startDate > endDate)
        return {
          success: false,
          message: 'Start Date must be less than End date',
        };

      const noOfDays = this.calculateDays(startDate, endDate);

      const leave = new this.leaveModel({
        employeeName: validateInput.employeeName,
        leaveType: validateInput.leaveType,
        startDate,
        endDate,
        noOfDays,
        reason: validateInput.reason || '',
        status: LeaveStatus.PENDING,
      });

      const savedLeave = await leave.save();

      return {
        success: true,
        message: `Your Leave has been Submitted Successfully for StartDate: ${validateInput.startDate} to EndDate:${validateInput.endDate}`,
      };
    } catch (Error) {
      console.error('Error adding a leave:', error);
      return {
        success: false,
        message: `Error Adding a leave ${Error.message}`,
      };
    }
  }

  private calculateDays(startDate: Date, endDate: Date): Number {
    let count = 0;
    const current = new Date(startDate);
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }
}
