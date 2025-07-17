import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Button, ActivityIndicator, Alert } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { fetchSummary } from "../lib/api";

export default function SummaryScreen() {
  const { fileId } = useLocalSearchParams();
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const text = await fetchSummary(fileId as string);
        setSummary(text.summary);
      } catch (e: any) {
        Alert.alert("Failed to fetch summary", e.message);
      }
      setLoading(false);
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
        Alert.alert("Sharing not available", "This device doesn't support sharing files.");
        return;
      }
  
      await Sharing.shareAsync(path);
    } catch (e: any) {
      Alert.alert("Error", "Failed to save or share file.\n" + e.message);
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <ScrollView>
        <Text style={{ fontSize: 16 }}>{summary}</Text>
      </ScrollView>
      <Button title="Save as .txt" onPress={saveToFile} />
    </View>
  );
}
