package com.atomichabit.controller;

import com.atomichabit.model.Habit;
import com.atomichabit.repository.HabitRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/habits")
public class HabitController {

    @Autowired
    private HabitRepository habitRepository;

    // ➕ Add Habit
    @PostMapping("/add")
    public Habit addHabit(@RequestBody Habit habit) {
        return habitRepository.save(habit);
    }

    // 📋 Get All Habits
    @GetMapping("/all")
    public List<Habit> getAllHabits() {
        return habitRepository.findAll();
    }

    // 🗑️ Delete Habit by ID
    @DeleteMapping("/delete/{id}")
    public String deleteHabit(@PathVariable Long id) {
        habitRepository.deleteById(id);
        return "Habit with ID " + id + " deleted!";
    }
 // ✏️ Update Habit
    @PutMapping("/update/{id}")
    public Habit updateHabit(@PathVariable Long id, @RequestBody Habit updatedHabit) {
        return habitRepository.findById(id).map(habit -> {
            habit.setTitle(updatedHabit.getTitle());
            habit.setDescription(updatedHabit.getDescription());
            habit.setCategory(updatedHabit.getCategory());
            habit.setReminderDate(updatedHabit.getReminderDate());
            habit.setCompleted(updatedHabit.isCompleted());
            return habitRepository.save(habit);
        }).orElseThrow(() -> new RuntimeException("Habit not found"));
    }

}
