import React, { useState } from "react";
import { View, Text, Button, ActivityIndicator, Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { uploadBook } from "../lib/api";

export default function UploadScreen() {
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

   const pickDocument = async () => {
     console.log("Opening document picker...");
     const result = await DocumentPicker.getDocumentAsync({
       type: "application/pdf",
     });
   
     console.log("📄 DocumentPicker result:", result);
   
     if (!result.canceled && result.assets && result.assets.length > 0) {
       const pickedFile = result.assets[0];
       setFile(pickedFile);
       console.log("✅ File selected:", pickedFile.name, pickedFile.uri);
     } else {
       console.log("No file selected");
     }
   };


  const handleUpload = async () => {
    if (!file) {
      Alert.alert("No file selected");
      console.log("Upload attempted without file");
      return;
    }

    console.log("Uploading file...");
    setLoading(true);

    try {
      const fileId = await uploadBook(file);
      console.log("File uploaded, fileId:", fileId);
      router.push({ pathname: "/summary", params: { fileId } });
    } catch (e: any) {
      console.error("Upload failed:", e);
      Alert.alert("Upload failed", e.message);
    }

    setLoading(false);
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Button title="Choose PDF" onPress={pickDocument} />
      {file && <Text style={{ marginVertical: 10 }}>{file.name}</Text>}
      <Button title="Upload and Summarize" onPress={handleUpload} disabled={!file || loading} />
      {loading && <ActivityIndicator size="large" style={{ marginTop: 20 }} />}
    </View>
  );
}
