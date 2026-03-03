import {Component, OnInit} from "@angular/core";
import {NgFor, NgIf} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {RouterLink} from "@angular/router";

@Component({
    selector: 'app-footer',
    standalone: true,
    imports: [NgFor, NgIf, FormsModule, RouterLink],
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
    ngOnInit(): void {
        throw new Error("Method not implemented.");
    }
    currentYear = new Date().getFullYear();
}
