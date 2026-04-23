import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReportService } from '../../services/report.service';
import { Summary, TrendResponse, TopPerformersResponse, DetailedOrder, AdvancedForecastResponse } from '../../models/report.model';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('revenueChart') revenueChartCanvas!: ElementRef<HTMLCanvasElement>;
  
  summary?: Summary;
  trend?: TrendResponse;
  topPerformers?: TopPerformersResponse;
  detailedReports: DetailedOrder[] = [];
  advancedForecast?: AdvancedForecastResponse;
  activeTab: string = 'TOP_CUSTOMERS';
  chart?: Chart;
  showAllPerformers: boolean = false;
  showAllSales: boolean = false;
  showAllChurn: boolean = false;

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    this.reportService.getSummary().subscribe(data => this.summary = data);
    this.reportService.getTrend().subscribe(data => {
      this.trend = data;
      this.initChart();
    });
    this.reportService.getTopPerformers(this.activeTab).subscribe(data => this.topPerformers = data);
    this.reportService.getDetailedReports().subscribe(data => this.detailedReports = data);
    this.reportService.getAdvancedForecast().subscribe(data => {
      this.advancedForecast = data;
      this.initChart(); // Re-init chart with forecast area
    });
  }

  ngAfterViewInit(): void {
    // Initial chart placeholder if trend data is already loaded or will be loaded
  }

  loadData(): void {
    this.reportService.getSummary().subscribe(data => this.summary = data);
    this.reportService.getTrend().subscribe(data => {
      this.trend = data;
      this.initChart();
    });
    this.setTab(this.activeTab);
    this.reportService.getDetailedReports().subscribe(data => this.detailedReports = data);
  }

  setTab(type: string): void {
    this.activeTab = type;
    this.showAllPerformers = false;
    this.reportService.getTopPerformers(type).subscribe(data => this.topPerformers = data);
  }

  getVisiblePerformers() {
    if (!this.topPerformers) return [];
    return this.showAllPerformers ? this.topPerformers.entries.slice(0, 10) : this.topPerformers.entries.slice(0, 5);
  }

  togglePerformers(): void {
    this.showAllPerformers = !this.showAllPerformers;
  }

  getVisibleSales() {
    return this.showAllSales ? this.detailedReports : this.detailedReports.slice(0, 5);
  }

  toggleSales(): void {
    this.showAllSales = !this.showAllSales;
  }

  getVisibleChurn() {
    if (!this.advancedForecast) return [];
    return this.showAllChurn ? this.advancedForecast.churnRisk : this.advancedForecast.churnRisk.slice(0, 5);
  }

  toggleChurn(): void {
    this.showAllChurn = !this.showAllChurn;
  }

  getPerformerWidth(revenue: number): number {
    if (!this.topPerformers || this.topPerformers.entries.length === 0) return 0;
    const max = this.topPerformers.entries[0].totalRevenue;
    return (revenue / max) * 100;
  }

  getRiskClass(score: number): string {
    if (score > 0.75) return 'danger';
    if (score > 0.20) return 'warning';
    return 'success';
  }

  initChart(): void {
    if (!this.trend || !this.revenueChartCanvas) return;

    const ctx = this.revenueChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const historyLabels = this.trend.history.map(h => this.formatDate(h.date));
    const projectionLabels = this.trend.projections.map(p => this.formatDate(p.date));
    const labels = [...historyLabels, ...projectionLabels];

    const historyRevenue = this.trend.history.map(h => h.revenue);
    const historyProfit = this.trend.history.map(h => h.profit);
    
    // Continuous projection lines starting from last historical points
    const lastHistoricalRev = historyRevenue[historyRevenue.length - 1];
    const lastHistoricalProfit = historyProfit[historyProfit.length - 1];
    
    const projectionRevData = [
      ...Array(historyRevenue.length - 1).fill(null),
      lastHistoricalRev,
      ...this.trend.projections.map(p => p.revenue)
    ];

    const projectionProfitData = [
      ...Array(historyProfit.length - 1).fill(null),
      lastHistoricalProfit,
      ...this.trend.projections.map(p => p.profit)
    ];

    // Monte Carlo Confidence Interval
    const mcMin = this.advancedForecast ? [
      ...Array(historyRevenue.length - 1).fill(null),
      lastHistoricalRev,
      ...this.advancedForecast.monteCarlo.map(m => m.revenueMin)
    ] : [];

    const mcMax = this.advancedForecast ? [
      ...Array(historyRevenue.length - 1).fill(null),
      lastHistoricalRev,
      ...this.advancedForecast.monteCarlo.map(m => m.revenueMax)
    ] : [];

    this.chart = new Chart(ctx, {
      data: {
        labels: labels,
        datasets: [
          {
            type: 'bar',
            label: 'Ricavi Storici',
            data: [...historyRevenue, ...Array(projectionLabels.length).fill(null)],
            backgroundColor: 'rgba(59, 130, 246, 0.6)',
            borderColor: '#3b82f6',
            borderWidth: 1,
            borderRadius: 6,
            barThickness: 30,
            order: 3
          },
          {
            type: 'line',
            label: 'Ricavi Previsti',
            data: projectionRevData,
            borderColor: '#3b82f6',
            borderDash: [6, 4],
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.4,
            order: 1
          },
          {
            type: 'line',
            label: 'Confidenza Max',
            data: mcMax,
            borderColor: 'rgba(59, 130, 246, 0.3)',
            borderWidth: 1,
            borderDash: [4, 4],
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            fill: '+1',
            pointRadius: 0,
            tension: 0.4,
            order: 2
          },
          {
            type: 'line',
            label: 'Confidenza Min',
            data: mcMin,
            borderColor: 'rgba(59, 130, 246, 0.3)',
            borderWidth: 1,
            borderDash: [4, 4],
            backgroundColor: 'transparent',
            fill: false,
            pointRadius: 0,
            tension: 0.4,
            order: 2
          },
          {
            type: 'line',
            label: 'Utile Netto',
            data: [...historyProfit, ...Array(projectionLabels.length).fill(null)],
            borderColor: '#10b981',
            backgroundColor: 'transparent',
            borderWidth: 3,
            pointRadius: 4,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#10b981',
            tension: 0.4,
            order: 1
          },
          {
            type: 'line',
            label: 'Utile Previsto',
            data: projectionProfitData,
            borderColor: '#10b981',
            borderDash: [6, 4],
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.4,
            order: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: { size: 12, weight: 500 }
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: '#1e293b',
            padding: 12,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
            callbacks: {
              label: (context) => {
                let label = context.dataset.label || '';
                if (label) label += ': ';
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9' },
            ticks: {
              font: { size: 11 },
              callback: (value) => new Intl.NumberFormat('it-IT', { notation: 'compact', compactDisplay: 'short' }).format(value as number)
            }
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 } }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index',
        }
      }
    });
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', { month: 'short' });
  }
}
