import { Module } from "@nestjs/common";
import { OneCMirrorController } from "./one-c-mirror.controller.js";
import { OneCMirrorService } from "./one-c-mirror.service.js";

@Module({
  controllers: [OneCMirrorController],
  providers: [OneCMirrorService]
})
export class OneCMirrorModule {}
