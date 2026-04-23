import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Summary, TrendResponse, TopPerformersResponse, DetailedOrder, AdvancedForecastResponse } from '../models/report.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private baseUrl = 'http://localhost:8080/api/reports';

  constructor(private http: HttpClient) {}

  getSummary(): Observable<Summary> {
    return this.http.get<Summary>(`${this.baseUrl}/summary`);
  }

  getTrend(): Observable<TrendResponse> {
    return this.http.get<TrendResponse>(`${this.baseUrl}/trend/seasonal`);
  }

  getTopPerformers(type: string): Observable<TopPerformersResponse> {
    return this.http.get<TopPerformersResponse>(`${this.baseUrl}/top-performers/${type}`);
  }

  getDetailedReports(): Observable<DetailedOrder[]> {
    return this.http.get<DetailedOrder[]>(`${this.baseUrl}/detailed`);
  }

  getAdvancedForecast(): Observable<AdvancedForecastResponse> {
    return this.http.get<AdvancedForecastResponse>(`${this.baseUrl}/forecast/advanced`);
  }

}
