#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    cuckoo_lib::run();
}