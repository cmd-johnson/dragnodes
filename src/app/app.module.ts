import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { DnModule } from 'projects/dn/src/public-api';

import { AppComponent } from './app.component';
import { TestGraphComponent } from './components/test-graph/test-graph.component';
import { BasicExampleComponent } from './basic-example/basic-example.component';
import { AppRoutingModule } from './app-routing.module';
import { CalculatorExampleComponent } from './calculator-example/calculator-example.component';
import { VariableNodeComponent } from './calculator-example/nodes/variable-node/variable-node.component';
import { ExpressionNodeComponent } from './calculator-example/nodes/expression-node/expression-node.component';

@NgModule({
  declarations: [
    AppComponent,
    TestGraphComponent,
    BasicExampleComponent,
    CalculatorExampleComponent,
    VariableNodeComponent,
    ExpressionNodeComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    DnModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
