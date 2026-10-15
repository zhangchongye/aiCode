package com.snackstore.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddressDTO {
    @NotBlank(message = "收货人不能为空")
    private String receiver;

    @NotBlank(message = "手机号不能为空")
    private String phone;

    private String province;
    private String city;
    private String district;
    private String detail;
    private Integer isDefault;
}
