import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { DnModule } from 'projects/dn/src/public-api';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    DnModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
