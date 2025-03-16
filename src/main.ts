import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { inject } from '@angular/core';
import { OrderService } from './app/services/order.service';
import { APP_INITIALIZER } from '@angular/core';

// Add an initializer function to initialize mock data
const initMockData = (orderService: OrderService) => {
  return () => {
    orderService.initializeMockData();
    console.log('Mock data initialized');
    return Promise.resolve();
  };
};

// Update app config to include the initializer
const updatedConfig = {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    {
      provide: APP_INITIALIZER,
      useFactory: (orderService: OrderService) => initMockData(orderService),
      deps: [OrderService],
      multi: true
    }
  ]
};

bootstrapApplication(AppComponent, updatedConfig)
  .then(() => {
    console.log('Application started successfully');
  })
  .catch((err) => console.error(err));
