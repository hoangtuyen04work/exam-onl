import type { BaseResponse, PageResponse } from '../types/class.type';
import type { StudentClass, StudentClassDetail } from '../types/class.type';
import axiosClient from './axiosClient';

export const studentClassApi = {
  getMyClasses: async (
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<StudentClass>> => {
    const response = await axiosClient.get('/student/classes', {
      params: { page, size },
    });
    return response.data;
  },

  getClassDetail: async (classId: number): Promise<BaseResponse<StudentClassDetail>> => {
    const response = await axiosClient.get(`/student/classes/${classId}`);
    console.log('Class Detail Response:', response);
    return response.data;
  },

  joinClassByCode: async (classCode: string): Promise<BaseResponse<StudentClass>> => {
    const response = await axiosClient.post('/student/classes/join', null, {
      params: { classCode },
    });
    return response.data;
  },
};
