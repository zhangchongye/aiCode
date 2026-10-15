package com.snackstore.controller;

import com.snackstore.common.Result;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
public class AdminUploadController {

    @Value("${snackstore.upload-dir}")
    private String uploadDir;

    @PostMapping("/upload")
    public Result<String> upload(@RequestParam("file") MultipartFile file) throws IOException {
        String original = file.getOriginalFilename();
        String ext = original != null && original.contains(".")
                ? original.substring(original.lastIndexOf('.')) : ".png";
        String filename = UUID.randomUUID().toString().replace("-", "") + ext;
        Path dir = Paths.get(uploadDir);
        Files.createDirectories(dir);
        file.transferTo(dir.resolve(filename));
        return Result.ok("/uploads/" + filename);
    }
}
