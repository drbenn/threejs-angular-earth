import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CubeComponent } from './cube/cube.component';
import { EarthComponent } from './earth/earth.component';
import { ModelComponent } from './model/model.component';

const routes: Routes = [
  {
    path: "",
    component: EarthComponent
  },
  {
    path: "model",
    component: ModelComponent
  },
  {
    path: "cube",
    component: CubeComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
