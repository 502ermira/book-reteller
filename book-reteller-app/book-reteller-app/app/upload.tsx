import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  TextInput,
  Keyboard, 
  TouchableWithoutFeedback,
  ImageBackground,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { uploadBook } from "../lib/api";

export default function UploadScreen() {
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [startPage, setStartPage] = useState("0");
  const [endPage, setEndPage] = useState("");

  const router = useRouter();

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });

    if (!result.canceled && result.assets?.length) {
      const picked = result.assets[0];
      setFile(picked);
    } else {
      console.log("No file selected");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      Alert.alert("No file selected");
      return;
    }
  
    const start = parseInt(startPage);
    const end = endPage ? parseInt(endPage) : null;
  
    if (isNaN(start) || (endPage && isNaN(end))) {
      Alert.alert("Invalid page number", "Please enter valid numeric values.");
      return;
    }
  
    setLoading(true);
    try {
      const fileId = await uploadBook(file, start, end);
      router.push({ pathname: "/summary", params: { fileId } });
    } catch (e: any) {
      Alert.alert("Upload failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground 
      source={require('../assets/images/back.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={styles.container}>
      <Text style={styles.title}>📘 Book Reteller</Text>
      <Text style={styles.subtitle}>Upload a PDF book to generate a summary</Text>

      <TouchableOpacity onPress={pickDocument} style={styles.button}>
        <Text style={styles.buttonText}>Choose PDF</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="Start Page (e.g. 0)"
        value={startPage}
        onChangeText={setStartPage}
      />
      
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="End Page (leave empty for full)"
        value={endPage}
        onChangeText={setEndPage}
      />

      {file && <Text style={styles.filename}>{file.name}</Text>}

      <TouchableOpacity
        onPress={handleUpload}
        style={[styles.button, !file && styles.disabledButton]}
        disabled={!file || loading}
      >
        <Text style={styles.buttonText}>Upload & Summarize</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" style={styles.loader} />}
    </View>
    </TouchableWithoutFeedback>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "rgba(0, 0, 0, 0.4)" },
  title: { fontSize: 30, fontWeight: "bold", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 17, textAlign: "center", marginBottom: 24, color: "#222" },
  button: {
    backgroundColor: "#0c377bff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 12,
  },
  buttonText: { color: "#fff", textAlign: "center", fontSize: 16 },
  disabledButton: { backgroundColor: "#5b7f98ff" },
  filename: { fontSize: 14, marginBottom: 16, textAlign: "center", color: "#333" },
  loader: { marginTop: 20},
  input: {
  borderWidth: 1,
  borderColor: "#bbb",
  padding: 10,
  borderRadius: 8,
  marginBottom: 12,
  fontSize: 16,
  backgroundColor: "#3f7bec72",
},

});
