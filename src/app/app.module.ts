import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { DnModule } from 'projects/dn/src/public-api';

import { AppComponent } from './app.component';
import { TestGraphComponent } from './components/test-graph/test-graph.component';
import { BasicExampleComponent } from './basic-example/basic-example.component';
import { AppRoutingModule } from './app-routing.module';
import { CalculatorExampleComponent } from './calculator-example/calculator-example.component';
import { VariableNodeComponent } from './calculator-example/nodes/variable-node/variable-node.component';
import { ExpressionNodeComponent } from './calculator-example/nodes/expression-node/expression-node.component';
import { SelectableDirective } from './calculator-example/selectable/selectable.directive';
import { CombineClassesPipe } from './combine-classes.pipe';

@NgModule({
  declarations: [
    AppComponent,
    TestGraphComponent,
    BasicExampleComponent,
    CalculatorExampleComponent,
    VariableNodeComponent,
    ExpressionNodeComponent,
    SelectableDirective,
    CombineClassesPipe
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    FormsModule,
    DnModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
