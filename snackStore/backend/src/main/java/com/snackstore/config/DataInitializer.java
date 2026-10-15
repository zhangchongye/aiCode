package com.snackstore.config;

import com.snackstore.entity.Category;
import com.snackstore.entity.Product;
import com.snackstore.entity.User;
import com.snackstore.mapper.CategoryMapper;
import com.snackstore.mapper.ProductMapper;
import com.snackstore.mapper.UserMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserMapper userMapper;
    private final CategoryMapper categoryMapper;
    private final ProductMapper productMapper;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public DataInitializer(UserMapper userMapper, CategoryMapper categoryMapper, ProductMapper productMapper) {
        this.userMapper = userMapper;
        this.categoryMapper = categoryMapper;
        this.productMapper = productMapper;
    }

    @Override
    public void run(String... args) {
        if (userMapper.selectCount(null) > 0) return;
        User admin = new User();
        admin.setUsername("admin");
        admin.setPassword(encoder.encode("admin123"));
        admin.setNickname("管理员");
        admin.setRole("ADMIN");
        userMapper.insert(admin);
        User demo = new User();
        demo.setUsername("demo");
        demo.setPassword(encoder.encode("demo123"));
        demo.setNickname("演示用户");
        demo.setRole("USER");
        userMapper.insert(demo);

        String[] names = {"膨化食品", "糖果巧克力", "饼干糕点", "坚果炒货", "肉干肉脯", "饮品冲调"};
        for (int i = 0; i < names.length; i++) {
            Category c = new Category();
            c.setName(names[i]);
            c.setSort(i + 1);
            categoryMapper.insert(c);
        }
        List<Category> categories = categoryMapper.selectList(null);
        String[][] items = {
            {"薯片原味", "1", "9.9", "100"}, {"薯片烧烤味", "1", "9.9", "80"},
            {"巧克力豆", "2", "15.8", "60"}, {"水果软糖", "2", "8.5", "120"},
            {"曲奇饼干", "3", "19.9", "50"}, {"蛋黄酥", "3", "25.0", "40"},
            {"每日坚果", "4", "29.9", "70"}, {"开心果", "4", "35.0", "30"},
            {"牛肉干", "5", "39.9", "45"}, {"猪肉脯", "5", "32.0", "55"},
            {"柠檬茶", "6", "6.5", "200"}, {"速溶咖啡", "6", "28.0", "90"},
        };
        for (String[] it : items) {
            Product p = new Product();
            p.setCategoryId(categories.get(Integer.parseInt(it[1]) - 1).getId());
            p.setName(it[0]);
            p.setDescription(it[0] + "，精选好料，好吃不贵。");
            p.setImage("");
            p.setPrice(new BigDecimal(it[2]));
            p.setStock(Integer.parseInt(it[3]));
            p.setSales(0);
            p.setStatus(1);
            productMapper.insert(p);
        }
    }
}
