package models

type Files struct {
	ID        int    `json:"id"`
	UserId    string `json:"user_id"`
	Path      string `json:"path"`
	CreatedAt string `json:"created_at"`
}
