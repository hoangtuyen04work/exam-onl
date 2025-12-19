import axiosClient from './axiosClient'

export const classChatApi = {
  // Get messages
  getMessages: async (classId: number, page: number = 0, size: number = 20) => {
    const response = await axiosClient.get(`/classes/${classId}/messages`, {
      params: { page, size }
    })
    return response.data
  },

  // Send message
  sendMessage: async (classId: number, content: string) => {
    const response = await axiosClient.post(`/classes/${classId}/messages`, {
      classId,
      content
    })
    return response.data
  },

  // Get chat settings
  getChatSettings: async (classId: number) => {
    const response = await axiosClient.get(`/classes/${classId}/chat-settings`)
    return response.data
  },

  // Update chat settings (teacher only)
  updateChatSettings: async (classId: number, allowStudentChat: boolean) => {
    const response = await axiosClient.put(`/classes/${classId}/chat-settings`, null, {
      params: { allowStudentChat }
    })
    return response.data
  }
}
