// test/helpers/concurrency-reporter.ts

export interface TestResult {
  testName: string;
  duration: number;
  totalRequests: number;
  successCount: number;
  failedCount: number;
  finalStock?: number;
  expectedStock?: number;
  stockConsistent: boolean;
  additionalInfo?: Record<string, any>;
}

export class ConcurrencyTestReporter {
  private results: TestResult[] = [];
  private startTime: number = 0;

  startTest(): void {
    this.startTime = Date.now();
  }

  endTest(): number {
    return Date.now() - this.startTime;
  }

  addResult(result: TestResult): void {
    this.results.push(result);
  }

  printSummary(): void {
    console.log('\n');
    console.log('='.repeat(80));
    console.log('CONCURRENCY TEST SUMMARY REPORT');
    console.log('='.repeat(80));
    console.log('\n');

    let totalTests = this.results.length;
    let totalRequests = 0;
    let totalSuccess = 0;
    let totalFailed = 0;
    let totalDuration = 0;
    let allConsistent = true;

    this.results.forEach((result, index) => {
      totalRequests += result.totalRequests;
      totalSuccess += result.successCount;
      totalFailed += result.failedCount;
      totalDuration += result.duration;

      if (!result.stockConsistent) {
        allConsistent = false;
      }

      console.log(`\n${index + 1}. ${result.testName}`);
      console.log('-'.repeat(80));

      console.log(`   Total Requests    : ${result.totalRequests}`);
      console.log(
        `   Success           : ${result.successCount} (${this.percentage(result.successCount, result.totalRequests)}%)`,
      );
      console.log(
        `   Failed            : ${result.failedCount} (${this.percentage(result.failedCount, result.totalRequests)}%)`,
      );
      console.log(`   Duration          : ${result.duration}ms`);
      console.log(
        `   Throughput        : ${(result.totalRequests / (result.duration / 1000)).toFixed(2)} req/s`,
      );

      if (result.finalStock !== undefined) {
        console.log(`   Final Stock       : ${result.finalStock}`);
      }

      if (result.expectedStock !== undefined) {
        console.log(`   Expected Stock    : ${result.expectedStock}`);
      }

      console.log(
        `   Stock Consistent  : ${result.stockConsistent ? 'YES' : 'NO'}`,
      );

      if (result.additionalInfo) {
        Object.entries(result.additionalInfo).forEach(([key, value]) => {
          console.log(`   ${key.padEnd(18)}: ${value}`);
        });
      }
    });

    // Overall Summary
    console.log('\n');
    console.log('='.repeat(80));
    console.log('OVERALL STATISTICS');
    console.log('='.repeat(80));
    console.log(`\n   Total Test Cases    : ${totalTests}`);
    console.log(`   Total Requests      : ${totalRequests}`);
    console.log(
      `   Total Success       : ${totalSuccess} (${this.percentage(totalSuccess, totalRequests)}%)`,
    );
    console.log(
      `   Total Failed        : ${totalFailed} (${this.percentage(totalFailed, totalRequests)}%)`,
    );
    console.log(
      `   Total Duration      : ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`,
    );
    console.log(
      `   Average Duration    : ${(totalDuration / totalTests).toFixed(2)}ms per test`,
    );
    console.log(
      `   Overall Throughput  : ${(totalRequests / (totalDuration / 1000)).toFixed(2)} req/s`,
    );
    console.log(
      `\n   Data Consistency    : ${allConsistent ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`,
    );

    console.log('\n' + '='.repeat(80));
    console.log(
      allConsistent
        ? 'RESULT: ALL CONCURRENCY TESTS PASSED'
        : 'RESULT: SOME TESTS NEED ATTENTION',
    );
    console.log('='.repeat(80));
    console.log('\n');
  }

  private percentage(value: number, total: number): string {
    if (total === 0) return '0.0';
    return ((value / total) * 100).toFixed(1);
  }

  clear(): void {
    this.results = [];
  }

  getResults(): TestResult[] {
    return this.results;
  }

  exportToJson(filename?: string): string {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.length,
        totalRequests: this.results.reduce(
          (sum, r) => sum + r.totalRequests,
          0,
        ),
        totalSuccess: this.results.reduce((sum, r) => sum + r.successCount, 0),
        totalFailed: this.results.reduce((sum, r) => sum + r.failedCount, 0),
        totalDuration: this.results.reduce((sum, r) => sum + r.duration, 0),
      },
      results: this.results,
    };

    const json = JSON.stringify(report, null, 2);

    if (filename) {
      const fs = require('fs');
      fs.writeFileSync(filename, json);
      console.log(`\nReport exported to: ${filename}`);
    }

    return json;
  }
}

// Singleton instance
export const reporter = new ConcurrencyTestReporter();
