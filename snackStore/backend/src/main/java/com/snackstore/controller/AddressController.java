package com.snackstore.controller;

import com.snackstore.common.Result;
import com.snackstore.common.UserContext;
import com.snackstore.dto.AddressDTO;
import com.snackstore.entity.Address;
import com.snackstore.service.AddressService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
public class AddressController {

    private final AddressService addressService;

    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    @GetMapping
    public Result<List<Address>> list() {
        return Result.ok(addressService.list(UserContext.getUserId()));
    }

    @PostMapping
    public Result<Void> create(@Valid @RequestBody AddressDTO dto) {
        addressService.create(UserContext.getUserId(), dto);
        return Result.ok(null);
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @Valid @RequestBody AddressDTO dto) {
        addressService.update(UserContext.getUserId(), id, dto);
        return Result.ok(null);
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        addressService.delete(UserContext.getUserId(), id);
        return Result.ok(null);
    }

    @PutMapping("/{id}/default")
    public Result<Void> setDefault(@PathVariable Long id) {
        addressService.setDefault(UserContext.getUserId(), id);
        return Result.ok(null);
    }
}
