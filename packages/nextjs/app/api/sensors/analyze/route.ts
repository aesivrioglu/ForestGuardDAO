import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { temperature, humidity, precipitation, windSpeed, soilMoisture } = body;

    const recommendedTasks = [];

    // Analyze data and generate task recommendations based on rules
    
    // 1. Soil Moisture Rule (Irrigation)
    // Assuming soil moisture below 0.15 m³/m³ is very dry
    if (soilMoisture !== undefined && soilMoisture < 0.15) {
      recommendedTasks.push({
        title: "Acil Sulama Görevi",
        description: "Toprak nemi kritik seviyede düşük. Belirtilen bölgedeki sulama sistemleri aktive edilmeli veya manuel sulama yapılmalıdır.",
        category: 1, // Irrigation
        priority: 3, // Critical
        suggestedReward: 0.05 // MON
      });
    }

    // 2. Fire Prevention Rule (High temp + Low humidity + High wind)
    if (temperature > 35 && humidity < 30 && windSpeed > 20) {
      recommendedTasks.push({
        title: "Yangın Önleme ve Gözlem",
        description: "Yüksek sıcaklık ve düşük nem nedeniyle yangın riski kritik seviyede. Bölgede devriye gezilmeli ve kuru dallar temizlenmelidir.",
        category: 3, // FirePrevention
        priority: 3, // Critical
        suggestedReward: 0.08 // MON
      });
    }

    // 3. Pest Control Rule (High temp + High humidity -> fungal/pest risk)
    if (temperature > 25 && humidity > 80) {
      recommendedTasks.push({
        title: "Zararlı ve Mantar Kontrolü",
        description: "Yüksek nem ve sıcaklık, mantar ve böcek üremesi için uygun ortam yaratıyor. İlaçlama veya organik kontrol gereklidir.",
        category: 2, // PestControl
        priority: 2, // High
        suggestedReward: 0.04 // MON
      });
    }

    // 4. General Cleanup (after heavy rain/wind)
    if (precipitation > 10 || windSpeed > 40) {
      recommendedTasks.push({
        title: "Çevre Temizliği ve Hasar Kontrolü",
        description: "Aşırı yağış/rüzgar sonrası devrilen ağaç, kırılan dal veya erozyon kontrolü yapılmalıdır.",
        category: 5, // WasteCleanup
        priority: 1, // Medium
        suggestedReward: 0.03 // MON
      });
    }
    
    // If everything is fine, maybe a routine monitoring task
    if (recommendedTasks.length === 0) {
      recommendedTasks.push({
        title: "Rutin Gözlem",
        description: "Sensör verileri normal. Orman alanında genel devriye ve durum tespiti yapılmalıdır.",
        category: 6, // Monitoring
        priority: 0, // Low
        suggestedReward: 0.01 // MON
      });
    }

    return NextResponse.json({ tasks: recommendedTasks });

  } catch (error) {
    console.error("Task Analysis Error:", error);
    return NextResponse.json({ error: "Failed to analyze sensor data" }, { status: 500 });
  }
}
