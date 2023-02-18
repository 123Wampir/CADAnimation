import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TimelineComponent } from './components/timeline/timeline.component';
import { PropertiesComponent } from './components/properties/properties.component';
import { FormsModule } from '@angular/forms';
import { DialogComponent } from './components/dialog/dialog.component';
import { ViewcubeComponent } from './components/viewcube/viewcube.component';
import { ContextmenuComponent } from './components/contextmenu/contextmenu.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MenubarComponent } from './components/menubar/menubar.component';
import { QuillModule, } from 'ngx-quill';

@NgModule({
  declarations: [
    AppComponent,
    TimelineComponent,
    PropertiesComponent,
    DialogComponent,
    ViewcubeComponent,
    ContextmenuComponent,
    MenubarComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ScrollingModule,
    QuillModule.forRoot({
      modules: {
        toolbar: [
          [{ font: [] }],
          [{ size: ['small', 'normal', 'large'] }],
          ['bold', 'italic', 'underline'],
          [{ background: [] }, { color: [] }],
          [{ align: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
        ]
      },
      placeholder: 'Annotation',
      theme: 'snow'  // or 'bubble'
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
