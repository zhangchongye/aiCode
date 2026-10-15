package com.snackstore.dto;

import lombok.Data;

@Data
public class CartUpdateDTO {
    private Integer quantity;
    private Integer checked;
}
