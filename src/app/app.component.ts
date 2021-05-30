import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { WebSocketService } from './services/web-socket.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit  {
  @ViewChild("video") video: ElementRef<HTMLVideoElement>;
  @ViewChild("inputCanvas") inputCanvas: ElementRef<HTMLCanvasElement>;
  @ViewChild("outputCanvas") outputCanvas: ElementRef<HTMLCanvasElement>;
  @ViewChild("img") img: ElementRef<HTMLCanvasElement>;

  inputCtx: CanvasRenderingContext2D;
  outputCtx: CanvasRenderingContext2D;

  isWebcamOn: boolean = false;

  inferenceInterval;
  captureInterval;

  coordinates: any = new Array();
  labels: any = new Array();

  imgTag: HTMLImageElement;
  imgURL: any;

  constructor(
    public webSocketService: WebSocketService,
    private domSanitizerService: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.webSocketService.openWebsocket();
    this.imgTag = new Image;
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    this.webSocketService.closeWebSocket();
    this.isWebcamOn = false;
  }

  dataURLtoFile(dataurl: string, filename: string): File {
    var arr = dataurl.split(","),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]),
      n = bstr.length,
      u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  toggleWebcam(): void {
    this.isWebcamOn = !this.isWebcamOn;
    if (this.isWebcamOn) {
      if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
            this.video.nativeElement.srcObject = stream;
            this.video.nativeElement.play();
        });
      }

      this.inputCtx = this.inputCanvas.nativeElement.getContext("2d");
      this.outputCtx = this.outputCanvas.nativeElement.getContext("2d");

      this.webSocketService.webSocket.onmessage = event => {
        const results = JSON.parse(event.data);
        this.coordinates = results.coordinates;
        this.labels = results.labels;
      };

      this.captureInterval = setInterval(() => {
        this.inputCtx.drawImage(this.video.nativeElement, 0, 0, 640, 480);
        this.inputCtx.lineWidth = 5;

        for(let i = 0; i < this.coordinates.length; i++) {
          const box = this.coordinates[i];
          if (this.labels[i] == 'Mask') {
            this.inputCtx.strokeStyle = "#00ff22";
          } else {
            this.inputCtx.strokeStyle = "#ff2a00";
          }
          this.inputCtx.beginPath();
          this.inputCtx.rect(box[0], box[1], box[2] - box[0], box[3] - box[1]);
          this.inputCtx.stroke();
        }
      }, 100);

      this.inferenceInterval = setInterval(() => {
        console.log(this.webSocketService.webSocket.readyState);
        if (this.webSocketService.webSocket.readyState === 1) {
          this.webSocketService.sendData(
            this.dataURLtoFile(
              this.inputCanvas.nativeElement.toDataURL(),
              'frame'
            )
          );
        } else {
          this.isWebcamOn = false;
        }
      }, 200);

    } else {
      clearInterval(this.inferenceInterval);
      clearInterval(this.captureInterval);
      this.inputCtx.clearRect(0, 0, 640, 480);
    }
  }
}
