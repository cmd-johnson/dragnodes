import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BasicExampleComponent } from './basic-example/basic-example.component';
import { CalculatorExampleComponent } from './calculator-example/calculator-example.component';

const routes: Routes = [
  {
    path: '',
    children: []
  },
  {
    path: 'basic', component: BasicExampleComponent
  },
  {
    path: 'calculator', component: CalculatorExampleComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
