import Papa from 'papaparse';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';

export const exportService = {
  // Экспорт рекомендаций в CSV
  async exportToCSV(recommendations, facilityType) {
    const facilityTypeNames = {
      school: 'Школы',
      hospital: 'Больницы',
      fire_station: 'Пожарные станции'
    };

    const csvData = recommendations.map((rec, index) => ({
      'Номер': index + 1,
      'Тип учреждения': facilityTypeNames[facilityType] || facilityType,
      'Широта': rec.coordinates[0].toFixed(6),
      'Долгота': rec.coordinates[1].toFixed(6),
      'Оценка (%)': (rec.score * 100).toFixed(1),
      'Ожидаемый охват (чел.)': rec.estimated_coverage || 'N/A',
      'Дата создания': new Date().toLocaleDateString('ru-RU')
    }));

    const csv = Papa.unparse(csvData, {
      delimiter: ';',
      header: true
    });

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const fileName = `recommendations_${facilityType}_${new Date().toISOString().split('T')[0]}.csv`;
    
    saveAs(blob, fileName);
  },

  // Экспорт отчёта в PDF
  async exportToPDF(statistics, recommendations, facilityType) {
    const facilityTypeNames = {
      school: 'школ',
      hospital: 'больниц',
      fire_station: 'пожарных станций'
    };

    const facilityTypeNamesTitle = {
      school: 'Школы',
      hospital: 'Больницы',
      fire_station: 'Пожарные станции'
    };

    const doc = new jsPDF();
    
    // Настройка шрифта (используем встроенный шрифт для поддержки кириллицы)
    doc.setFont('helvetica');
    
    // Заголовок
    doc.setFontSize(20);
    doc.text('InfraMap - Отчёт по анализу', 20, 30);
    
    doc.setFontSize(16);
    doc.text(`Размещение ${facilityTypeNames[facilityType]}`, 20, 45);
    
    // Дата
    doc.setFontSize(10);
    doc.text(`Дата создания: ${new Date().toLocaleDateString('ru-RU')}`, 20, 55);
    
    // Статистика
    doc.setFontSize(14);
    doc.text('Основные показатели:', 20, 75);
    
    doc.setFontSize(12);
    let yPos = 90;
    
    doc.text(`• Количество рекомендуемых точек: ${statistics.new_points_count}`, 25, yPos);
    yPos += 15;
    
    doc.text(`• Улучшение покрытия: +${statistics.coverage_improvement?.toFixed(1)}%`, 25, yPos);
    yPos += 15;
    
    doc.text(`• Дополнительно охвачено: ${statistics.people_covered?.toLocaleString()} человек`, 25, yPos);
    yPos += 25;
    
    // Рекомендации
    doc.setFontSize(14);
    doc.text('Рекомендуемые точки размещения:', 20, yPos);
    yPos += 15;
    
    doc.setFontSize(10);
    
    recommendations.forEach((rec, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 30;
      }
      
      doc.text(`${index + 1}. Координаты: ${rec.coordinates[0].toFixed(4)}, ${rec.coordinates[1].toFixed(4)}`, 25, yPos);
      yPos += 10;
      
      doc.text(`   Оценка: ${(rec.score * 100).toFixed(1)}% | Охват: ~${rec.estimated_coverage?.toLocaleString() || 'N/A'} чел.`, 25, yPos);
      yPos += 15;
    });
    
    // Подвал
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Страница ${i} из ${pageCount}`, 20, 285);
      doc.text('Создано с помощью InfraMap', 150, 285);
    }
    
    const fileName = `inframap_report_${facilityType}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  },

  // Экспорт данных для презентации
  async exportPresentationData(statistics, recommendations, facilityType) {
    const data = {
      metadata: {
        facilityType,
        generatedAt: new Date().toISOString(),
        version: '1.0'
      },
      statistics,
      recommendations: recommendations.map(rec => ({
        coordinates: rec.coordinates,
        score: rec.score,
        estimated_coverage: rec.estimated_coverage,
        type: rec.type
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    
    const fileName = `inframap_data_${facilityType}_${new Date().toISOString().split('T')[0]}.json`;
    saveAs(blob, fileName);
  }
}; 