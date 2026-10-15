package com.snackstore.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class CartUpdateDTO {
    @Min(value = 1, message = "数量至少为 1")
    private Integer quantity;

    @Min(value = 0)
    @Max(value = 1)
    private Integer checked;
}
