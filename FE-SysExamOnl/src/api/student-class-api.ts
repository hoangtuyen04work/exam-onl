import { BaseResponse, PageResponse } from '../types/common.type';
import { StudentClass, StudentClassDetail } from '../types/class.type';
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

  getClassDetail: async (classId: number): Promise<StudentClassDetail> => {
    const response = await axiosClient.get(`/student/classes/${classId}`);
    return response.data;
  },
};
