import axios from "axios";
import { DocumentPickerAsset } from "expo-document-picker";

const BASE_URL = "http://192.168.1.161:8000/api/v1";

export const uploadBook = async (
  file: DocumentPickerAsset,
  startPage = 0,
  endPage = null
) => {
  const formData = new FormData();

  formData.append("file", {
    uri: file.uri,
    name: file.name ?? "book.pdf",
    type: "application/pdf",
  } as any);

  formData.append("start_page", startPage.toString());
  if (endPage !== null) formData.append("end_page", endPage.toString());

  const response = await axios.post(`${BASE_URL}/summarize`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data.file_id;
};

export const fetchSummary = async (fileId: string) => {
  const response = await axios.get(`${BASE_URL}/summary/${fileId}`);
  return response.data;
};
