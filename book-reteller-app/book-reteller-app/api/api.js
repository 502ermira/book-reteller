import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/api/v1';

export const uploadBook = async (file, startPage = 0, endPage = null) => {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: 'application/pdf',
  });
  formData.append('start_page', startPage);
  if (endPage !== null) formData.append('end_page', endPage);

  const response = await axios.post(`${BASE_URL}/summarize`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.file_id;
};

export const fetchSummary = async (fileId) => {
  const response = await axios.get(`${BASE_URL}/summary/${fileId}`);
  return response.data.summary;
};
