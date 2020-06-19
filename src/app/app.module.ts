import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { DnModule } from 'projects/dn/src/public-api';
import { TestGraphComponent } from './components/test-graph/test-graph.component';

@NgModule({
  declarations: [
    AppComponent,
    TestGraphComponent
  ],
  imports: [
    BrowserModule,
    DnModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
