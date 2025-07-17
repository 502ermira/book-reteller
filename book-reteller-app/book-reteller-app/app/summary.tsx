import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Button,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useLocalSearchParams } from "expo-router";
import { fetchSummary } from "../lib/api";

export default function SummaryScreen() {
  const { fileId } = useLocalSearchParams();
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const result = await fetchSummary(fileId as string);
        setSummary(result.summary);
      } catch (e: any) {
        Alert.alert("Failed to load summary", e.message);
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  const saveToFile = async () => {
    try {
      const path = FileSystem.documentDirectory + `${fileId}.txt`;
      await FileSystem.writeAsStringAsync(path, summary, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Not supported", "This device doesn't support sharing.");
        return;
      }

      await Sharing.shareAsync(path);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📄 Summary</Text>
      <ScrollView style={styles.scroll}>
        <Text style={styles.summaryText}>{summary}</Text>
      </ScrollView>
      <TouchableOpacity onPress={saveToFile} style={styles.button}>
        <Text style={styles.buttonText}>Save as .txt</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, marginTop:53, backgroundColor: "#f5f5f5" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  scroll: { flex: 1, marginBottom: 20 },
  summaryText: { fontSize: 16, lineHeight: 24, color: "#333" },
  button: {
    backgroundColor: "#10B981",
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: { textAlign: "center", color: "#fff", fontSize: 16 },
});
